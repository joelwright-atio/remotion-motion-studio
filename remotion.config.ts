// Remotion CLI config — applies to `npx remotion studio` and `npx remotion render`.
// Docs: https://www.remotion.dev/docs/config
import { Config } from "@remotion/cli/config";

Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setCodec("h264");
