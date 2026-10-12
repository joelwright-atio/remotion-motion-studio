// Entry point. Only registers the root — add compositions in Root.tsx.
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
