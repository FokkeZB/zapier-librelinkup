import { version as platformVersion } from "zapier-platform-core";

import ConnectionTrigger from "./triggers/connection";
import GlucoseMeasurement from "./triggers/glucoseMeasurement";
import Authentication from "./authentication";

const { version } = require("../package.json");

export default {
  version,
  platformVersion,
  authentication: Authentication.authentication,
  beforeRequest: [Authentication.beforeRequest],
  triggers: {
    [ConnectionTrigger.key]: ConnectionTrigger,
    [GlucoseMeasurement.key]: GlucoseMeasurement,
  },
};
