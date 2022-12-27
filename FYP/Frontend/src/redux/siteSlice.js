import { createSlice } from "@reduxjs/toolkit"
import { act } from "react-dom/test-utils"

const initialState = {
  "sidebar": {},
  "breadcrumb": {},
  "sidebarInformation": {}
}

export const siteState = createSlice({
  name: "mutator",
  initialState,
  reducers: {
    // Takes in a string of the 
    setSidebarActive: (state, action) => {
      state["sidebar"] = action
    },
    // Takes in a hashmap of {"Breadcrumb Name", "URL"}
    setBreadcrumbPath: (state, action) => {
      state["breadcrumb"] = action
    },
    setSidebarInformation: (state, action) => {
      state["sidebarInformation"] = action
    }
  }
})

export const { setSidebarActive, setBreadcrumbPath, setSidebarInformation } = siteState.actions
export default siteState.reducer