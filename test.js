const axios = require("axios");

const LIBRE_LINK_SERVER = "https://api-us.libreview.io";

let jwtToken = "";

const instance = axios.create({
  baseURL: LIBRE_LINK_SERVER,
  headers: {
    "accept-encoding": "gzip",
    "cache-control": "no-cache",
    connection: "Keep-Alive",
    "content-type": "application/json",
    product: "llu.android",
    version: "4.2.1",
  },
});
instance.interceptors.request.use(
  (config) => {
    if (jwtToken && config.headers) {
      // eslint-disable-next-line no-param-reassign
      config.headers.authorization = `Bearer ${jwtToken}`;
    }

    return config;
  },
  (e) => e,
  { synchronous: true }
);

const test = async () => {
  const loginResponse = await instance.post("/llu/auth/login", {
    email: "mail@levizb.nl",
    password: "yeWYNbbq_D2fAgQnoL_EFm22",
  });

  console.log(loginResponse);
};

test().then(console.info, console.error);
