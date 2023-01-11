import React, { useState, useRef, useEffect } from 'react'
import { LayoutNoSidebar } from '../../layouts/LayoutNoSidebar'
import { Link } from "react-router-dom"
import axios from 'axios'
import jwtDecode from 'jwt-decode'
import * as humanDate from "human-date"

const FILTER_OPTIONS = {
  "ALL": "All",
  "PROJECTS": "Projects",
  "MILESTONES": "Milestones",
}

export const NotificationList = () => {
  const [notifications, setNotifications] = useState([])
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS["ALL"])
  const [genericQuery, setGenericQuery] = useState("")

  let searchInputRef = useRef()

  const handleSearchKeyUp = (e) => {
    if (e.keyCode == 13) {
      searchNotifications()
    }
  }

  useEffect(() => {
    searchNotifications()
  }, [selectedFilter])

  const searchNotifications = async () => {
    let userId = jwtDecode(localStorage.getItem("token"))["user_id"]
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/notifications/search?userId=${userId}&query=${searchInputRef.current.value}&scope=${selectedFilter}`)

    if (response.status == 200) {
      setNotifications(response.data)
      setGenericQuery(searchInputRef.current.value)
    }
  }

  const getNotificationSubject = (notification) => {
    if (notification["milestoneId"] == null) {
      return `${notification["projectName"]}`
    }

    return `${notification["milestoneName"]}`
  }

  const getNotificationLink = (notification) => {
    if (notification["milestoneId"] == null) {
      return `/projects/${notification["projectId"]}`
    }

    return `/projects/${notification["projectId"]}/milestones/${notification["milestoneId"]}`
  }

  useEffect(() => {
    document.title = "Notifications"
  }, [])

  return (
    <LayoutNoSidebar>
      <div className='container'>
        <div className="d-flex justify-content-between py-3 mb-2 border-bottom align-content-center">
          <h5 className="mb-0 align-self-center bold">Notifications</h5>
          <div>
            <Link to={"/notifications/emails/templates/new"} className="btn btn-light border font-sm no-decoration-on-hover align-self-center">New email template</Link>
          </div>
        </div>

        <div>
          <div className='d-flex'>
            <input className="form-control font-sm" placeholder="Search project name or milestone name" ref={searchInputRef} onKeyUp={e => handleSearchKeyUp(e)} />
            <button className='btn btn-primary font-sm ms-2' onClick={searchNotifications}>Search</button>
          </div>
        </div>

        <div className="d-flex justify-content-between border-bottom flex-wrap">
          <div className="d-flex order-2 order-lg-1 flex-grow-1 flex-md-grow-1">
            {Object.keys(FILTER_OPTIONS).map(key => {
              return (
                <span className={`nav-link font-sm milestones-scope text-dark cursor-pointer ${selectedFilter == FILTER_OPTIONS[key] ? "active bold" : ""}`} onClick={e => setSelectedFilter(FILTER_OPTIONS[key])}>{FILTER_OPTIONS[key]}</span>
              )
            })}
          </div>
        </div>

        <p className="font-sm text-secondary mb-0 py-3 bg-light px-3 border-bottom">Showing {notifications.length} result(s) for <span className="text-danger">"{genericQuery}"</span></p>

        <div className="border-bottom py-3 flex-wrap d-none d-lg-block mb-sm-0 mb-lg-2">
          <div className='row'>
            <div class="col-lg-7 font-sm bold">Notification</div>
            <div class="col-lg-2 text-end font-sm bold">Time</div>
          </div>
        </div>

        {notifications.map(value => {
          return (
            <div className='py-1 mb-2'>
              <div className='row'>

                <div className='d-flex col-lg-7'>
                  <div>
                    <Link to={`/projects/${value["projectId"]}`} className='text-wrap'>
                      {value["projectName"]}
                    </Link>
                    <br />

                    <span className='text-wrap font-sm'>
                      {value["milestoneName"] != null &&
                        <span className='bold'>Milestone • </span>
                      }

                      {value["milestoneName"] == null &&
                        <span className='bold'>Project • </span>
                      }

                      <Link className='text-dark bold' to={getNotificationLink(value)}>{getNotificationSubject(value)}</Link> {value["message"]}
                    </span>
                  </div>
                </div>

                <div className='text-end align-self-center font-xsm text-secondary col-lg-2'>
                  {humanDate.relativeTime(value["dateCreated"]).trim() == "ago" &&
                    <span>0 seconds</span>
                  }

                  {humanDate.relativeTime(value["dateCreated"]) != "" &&
                    <span>
                      {humanDate.relativeTime(value["dateCreated"])}
                    </span>
                  }
                </div>

                <div className='align-self-center col-lg-3 text-end'>
                  <Link to={`/notifications/${value["id"]}/email`} className='btn-light border font-sm btn no-decoration-on-hover'>Send email</Link>
                </div>
              </div>
            </div>
          )
        })}



      </div>

    </LayoutNoSidebar>
  )
}
