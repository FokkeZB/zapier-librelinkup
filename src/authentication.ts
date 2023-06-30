import { Bundle, HttpRequestOptions, ZObject } from "zapier-platform-core";

const getRegionFromBundleOrDefault = (bundle: Bundle): string =>
  bundle.authData.region || "us";

const getBaseUrlForBundle = (bundle: Bundle): string =>
  `https://api-${getRegionFromBundleOrDefault(bundle)}.libreview.io`;

const getSessionKey = async (
  z: ZObject,
  bundle: Bundle
): Promise<{
  token: string;
  region: string;
}> => {
  const response = await z.request({
    method: "POST",
    url: `${getBaseUrlForBundle(bundle)}/llu/auth/login`,
    body: {
      email: bundle.authData.email,
      password: bundle.authData.password,
    },
  });

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
          authTicket: {
            token: string;
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

  return {
    token: data.data.authTicket.token,
    region: getRegionFromBundleOrDefault(bundle),
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
  const absoluteURL = new URL(request.url ?? "/", getBaseUrlForBundle(bundle));

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
    product: "llu.android",
    version: "4.7",
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
