import React from 'react';
import { createRoot } from "react-dom/client";
import { Craft } from "./src";

const craft = createRoot(document.getElementById("craft"));
craft.render(<Craft />);
