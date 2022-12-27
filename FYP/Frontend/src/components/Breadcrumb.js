import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux/es/exports'
import { Link } from 'react-router-dom'

export const Breadcrumb = () => {
  const breadcrumbPath = useSelector(state => state["counter"]["breadcrumb"])

  useEffect(() => {
    console.log(breadcrumbPath)
  }, [breadcrumbPath])

  return (
    <nav className='align-self-center'>
      <ol className="breadcrumb mb-0">
        <li className="breadcrumb-item font-xsm"><Link to={"/"}>Projects</Link></li>

        {
          Object.keys(breadcrumbPath).length > 0 &&

          Object.keys(breadcrumbPath["payload"]).map((key, index) => {
            if (index == Object.keys(breadcrumbPath["payload"]).length - 1) {
              return <li className="breadcrumb-item font-xsm active" key={key}>{key}</li>
            } else {
              return <li className="breadcrumb-item font-xsm" key={key}><Link to={breadcrumbPath["payload"][key]}>{key}</Link></li>
            }
          })
        }
      </ol>
    </nav >
  )
}
