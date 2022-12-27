import React from 'react'

const MILESTONE_STATUS = {
  "NOT_STARTED": "Not Started",
  "ONGOING": "Ongoing",
  "OVERDUE_COMPLETION": "Overdue Completion",
  "AWAITING_PAYMENT": "Awaiting Payment",
  "PAID": "Paid",
  "OVERDUE_PAYMENT": "Overdue Payment"
}

export const MilestoneStatus = (props) => {

  switch (props.status) {
    case "NOT_STARTED":
      return (
        <span class="badge bg-light text-dark fw-normal">{MILESTONE_STATUS.NOT_STARTED}</span>
      )
    case "ONGOING":
      return (
        <span class="badge bg-primary text-light fw-normal">{MILESTONE_STATUS.ONGOING}</span>
      )
    case "OVERDUE_COMPLETION":
      return (
        <span class="badge bg-danger text-light fw-normal">{MILESTONE_STATUS.OVERDUE_COMPLETION}</span>
      )
    case "AWAITING_PAYMENT":
      return (
        <span class="badge bg-warning text-dark fw-normal">{MILESTONE_STATUS.AWAITING_PAYMENT}</span>
      )
    case "PAID":
      return (
        <span class="badge bg-success text-light fw-normal">{MILESTONE_STATUS.PAID}</span>
      )
    case "OVERDUE_PAYMENT":
      return (
        <span class="badge bg-danger text-light fw-normal">{MILESTONE_STATUS.OVERDUE_PAYMENT}</span>
      )
  }
}
