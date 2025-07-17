import { Bundle, HttpRequestOptions, ZObject } from "zapier-platform-core";
import { createHash } from "crypto";

const getBaseUrlForBundle = (region?: string): string =>
  `https://api${region ? `-${region}` : ""}.libreview.io`;

type Step = {
  type: string;
  componentName: "AcceptDocument";
  props: {
    reaccept: boolean;
    titleKey: string;
    type: string;
  };
};

const getSessionKey = async (
  z: ZObject,
  bundle: Bundle
): Promise<{
  token: string;
  region: string;
  accountId: string;
}> => {
  const request = bundle.inputData.acceptTermsOfType
    ? {
        method: "POST" as const,
        url: `${getBaseUrlForBundle(bundle.authData.region)}/auth/continue/${
          bundle.inputData.acceptTermsOfType
        }`,
      }
    : {
        method: "POST" as const,
        url: `${getBaseUrlForBundle(bundle.authData.region)}/llu/auth/login`,
        body: {
          email: bundle.authData.email,
          password: bundle.authData.password,
        },
      };

  const response = await z.request(request);

  const data = response.data as
    | {
        status: 0;
        data: {
          redirect: true;
          region: string;
        };
      }
    | {
        status: 4;
        data: {
          step: Step;
          user: {
            accountType: string;
            country: string;
            uiLanguage: string;
          };
          authTicket: {
            token: string;
            expires: number;
            duration: number;
          };
        };
      }
    | {
        status: 0;
        data: {
          user: {
            id: string;
          };
          authTicket: {
            token: string;
            expires: number;
            duration: number;
          };
        };
      };

  if ("redirect" in data.data) {
    return getSessionKey(z, {
      ...bundle,
      authData: {
        ...bundle.authData,
        region: data.data.region,
      },
    });
  }

  if ("step" in data.data) {
    return getSessionKey(z, {
      ...bundle,
      inputData: {
        ...bundle.inputData,
        acceptTermsOfType: data.data.step.type,
      },
    });
  }

  return {
    token: data.data.authTicket.token,
    region: bundle.authData.region,
    accountId: createHash("sha256").update(data.data.user.id).digest("hex"),
  };
};

const authentication = {
  type: "session",
  fields: [
    {
      label: "Email Address",
      key: "email",
      type: "string",
      required: true,
    },
    {
      key: "password",
      type: "password",
      required: true,
    },
    {
      key: "token",
      type: "string",
      computed: true,
      required: false,
    },
    {
      key: "region",
      type: "string",
      computed: true,
      required: false,
    },
  ],
  sessionConfig: {
    perform: getSessionKey,
  },
  test: {
    url: "/llu/connections",
  },
  connectionLabel: "{{email}}",
};

const beforeRequest = (
  request: HttpRequestOptions,
  _z: ZObject,
  bundle: Bundle
) => {
  const absoluteURL = new URL(
    request.url ?? "/",
    getBaseUrlForBundle(bundle.authData.region)
  );

  if (absoluteURL.hostname === "store.zapier.com") {
    return request;
  }

  request.url = absoluteURL.href;

  request.headers = {
    ...request.headers,
    "accept-encoding": "gzip",
    "cache-control": "no-cache",
    connection: "Keep-Alive",
    "content-type": "application/json",
    "account-id": bundle.authData.accountId,
    product: "llu.ios",
    version: "4.12.0",
  };

  if (absoluteURL.pathname !== "/llu/auth/login" && bundle.authData.token) {
    request.headers.authorization = `Bearer ${bundle.authData.token}`;
  }

  return request;
};

export default {
  authentication,
  beforeRequest,
};
