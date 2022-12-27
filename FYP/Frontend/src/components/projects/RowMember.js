import React from 'react'
import { dateFormat } from '../../utils/CommonUtils'
import { Link } from "react-router-dom"

export const RowMember = (props) => {
  return (
    <div className='milestone'>
      <div className="row mb-3 justify-content-between">
        <div className="col-12 col-lg-5">
          <Link to={props["id"]} className="my-0 bold font-sm text-dark">{props["name"]}</Link>
          <p className="my-0 font-sm text-secondary">{props["email"]}</p>
        </div>

        <div className="col-12 col-lg-4">
          <span className='badge rounded-pill bg-light text-dark' style={{ fontWeight: 500 }}>{props["role"]}</span>
        </div>

        <div className="col-12 col-lg-2 text-end">
          <span className='font-sm text-secondary'>Joined on {props["dateJoined"]}</span>
        </div>
      </div>
    </div>
  )
}
