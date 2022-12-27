import { configureStore } from "@reduxjs/toolkit";
import siteSlice from "./siteSlice";


export const store = configureStore({
  reducer: {
    counter: siteSlice
  },
})