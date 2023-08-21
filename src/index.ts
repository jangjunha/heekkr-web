import { Loader } from "@googlemaps/js-api-loader";

export const maps = new Loader({
  apiKey: "",
  version: "weekly",
  libraries: ["geometry"],
});
