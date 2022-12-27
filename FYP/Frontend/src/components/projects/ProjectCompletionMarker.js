import React, { useEffect, useState } from 'react'

export const ProjectCompletionMarker = (props) => {
  if (props["isCompleted"]) {
    return (
      <div className='d-flex py-3 border-bottom delete-card ps-3' style={{ color: "#721c24" }}>
        <i className='fa fa-lock align-self-center font-sm me-2'></i> <span className='align-self-center font-sm'><span className='fw-bold'>Project has been locked</span> due to being marked as completed, editing and deleting has been disabled.</span>
      </div>
    )
  }

  return (
    <></>
  )
}
