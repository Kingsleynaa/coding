import React, { useEffect, useState } from 'react'
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr'
import jwtDecode from 'jwt-decode'
import axios from 'axios'
import { Link } from "react-router-dom"
import * as humanDate from "human-date"

export const Notifications = () => {
  const [connection, setConnection] = useState(null)
  const [notifications, setNotifications] = useState([])

  // Connecting to the SignalR hub
  useEffect(() => {
    const connect = new HubConnectionBuilder()
      .withUrl(`${process.env.REACT_APP_API_SERVER}/hubs/notifications`,
        { accessTokenFactory: () => `${localStorage.getItem("token")}` })
      .withAutomaticReconnect()
      .build();

    retrieveNotificationsForUser()
    setConnection(connect);
  }, []);

  const retrieveNotificationsForUser = async () => {
    let userId = jwtDecode(localStorage.getItem("token"))["user_id"]
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/notifications/user/${userId}`)
    console.log(response.data)

    if (response.status == 200) {
      setNotifications(response.data)
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

  const isSeenIndicator = (isSeen) => {
    if (isSeen) {
      return
    }

    return (
      <i className='fa fa-circle text-danger align-self-center' style={{ fontSize: "8px" }}></i>
    )
  }

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          connection.on("NewNotification", (message) => {
            retrieveNotificationsForUser()
          });
        })
        .catch((error) => console.log(error));
    }
  }, [connection]);


  const markNotificationAsRead = async () => {
    let userId = jwtDecode(localStorage.getItem("token"))["user_id"]
    let payload = {
      "userId": userId,
      "notificationIdList": notifications.filter(x => !x["isSeen"]).map(x => x["id"])
    }

    console.log(payload)

    let response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/notifications/mark-as-read`, payload)

    if (response.status == 200) {
      retrieveNotificationsForUser()
    }
  }


  return (
    <span className="nav-item dropdown me-sm-0 me-lg-5 align-self-center">

      <span onClick={markNotificationAsRead} className="dropdown-toggle font-sm d-flex" id="notifications" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">
        <div>
          <fa className="fa fa-bell me-2"></fa>
          <span>Notifications</span>
          {notifications.filter(x => !x["isSeen"]).length > 0 &&
            <span className="position-absolute top-0 start-100 ms-2 translate-middle badge rounded-pill bg-danger">
              {notifications.filter(x => !x["isSeen"]).length}
              <span className="visually-hidden">unread messages</span>
            </span>
          }
        </div>
      </span>

      <ul className="dropdown-menu dropdown-menu-end notifications" aria-labelledby="navbarDropdown" style={{ width: "350px", maxHeight: "500px", overflow: "auto" }}>
        <li><Link className="dropdown-item font-sm no-decoration-on-hover" to={"/notifications"}>View all <fa className="ms-1 fa fa-arrow-right"></fa></Link></li>
        <li><hr className="dropdown-divider bg-danger" /></li>

        {/* Notification entry */}
        {notifications.map(value => {
          return (
            <>
              <li>
                <Link className="dropdown-item font-sm no-decoration-on-hover" to={getNotificationLink(value)}>
                  <div className='d-inline-flex flex-grow-0'>
                    <div className='me-3 align-self-center d-flex'>
                      {isSeenIndicator(value["isSeen"])}
                    </div>

                    <div className='flex-grow-0'>
                      <span className='bold text-wrap'>
                        {value["projectName"]}
                      </span>
                      <br />
                      <span className='text-wrap'>
                        {value["milestoneName"] != null &&
                          <span>Milestone • </span>
                        }

                        {value["milestoneName"] == null &&
                          <span>Project • </span>
                        }
                        <Link to={getNotificationLink(value)}>{getNotificationSubject(value)}</Link> {value["message"]}</span>
                    </div>
                  </div>

                  <div className='text-end font-xsm text-secondary'>
                    {humanDate.relativeTime(value["dateCreated"]).trim() == "ago" &&
                      <span>0 seconds</span>
                    }

                    {humanDate.relativeTime(value["dateCreated"]) != "" &&
                      <span>
                        {humanDate.relativeTime(value["dateCreated"])}
                      </span>
                    }
                  </div>

                </Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
            </>
          )
        })}
      </ul>
    </span >
  )
}
