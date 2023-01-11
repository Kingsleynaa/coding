import React from 'react'

export const RiskStatus = (props) => {

  if (props.level == "Low") {
    return (
      <span class="badge rounded-pill bg-success font-xsm" style={{ fontWeight: "500" }}>Low</span>
    )
  }

  if (props.level == "Medium") {
    return (
      <span class="badge rounded-pill bg-warning text-dark font-xsm" style={{ fontWeight: "500" }}>Medium</span>
    )
  }

  if (props.level == "High") {
    return (
      <span class="badge rounded-pill bg-danger font-xsm" style={{ fontWeight: "500" }}>High</span>
    )
  }

}
