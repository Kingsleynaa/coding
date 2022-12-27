import React, { useState } from 'react'

const PROJECT_STATUS = {
  "ONGOING": "Ongoing",
  "OVERDUE_COMPLETION": "Overdue Completion",
  "AWAITING_PAYMENT": "Awaiting Payment",
  "PAID": "Paid",
  "OVERDUE_PAYMENT": "Overdue Payment"
}

export const ProjectStatus = (props) => {
  switch (props.status) {
    case "ONGOING":
      return (
        <span class="badge bg-primary text-light fw-normal">{PROJECT_STATUS.ONGOING}</span>
      )
    case "OVERDUE_COMPLETION":
      return (
        <span class="badge bg-danger text-light fw-normal">{PROJECT_STATUS.OVERDUE_COMPLETION}</span>
      )
    case "AWAITING_PAYMENT":
      return (
        <span class="badge bg-warning text-dark fw-normal">{PROJECT_STATUS.AWAITING_PAYMENT}</span>
      )
    case "PAID":
      return (
        <span class="badge bg-success text-light fw-normal">{PROJECT_STATUS.PAID}</span>
      )
    case "OVERDUE_PAYMENT":
      return (
        <span class="badge bg-danger text-light fw-normal">{PROJECT_STATUS.OVERDUE_PAYMENT}</span>
      )
  }
}
