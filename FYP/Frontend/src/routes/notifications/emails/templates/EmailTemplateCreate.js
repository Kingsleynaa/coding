import React, { useEffect, useRef, useState } from 'react'
import { LayoutNoSidebar } from '../../../../layouts/LayoutNoSidebar'
import { Link, useNavigate } from "react-router-dom"
import axios from 'axios'
import $ from "jquery"
import "jquery-validation-unobtrusive"

export const EmailTemplateCreate = () => {
  const navigate = useNavigate()

  const [notificationCategories, setNotificationCategories] = useState([])
  const [emailBody, setEmailBody] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [focusedField, setFocusedField] = useState(null)

  const templateNameRef = useRef()
  const notificationCategoryRef = useRef()

  useEffect(() => {
    loadNotificationCategories()
  }, [])

  const loadNotificationCategories = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/notifications/categories`)

    if (response.status == 200) {
      console.log(response)
      setNotificationCategories(response.data)
    }
  }

  const addSelector = (text) => {
    if (focusedField["id"] == "emailBody") {
      setEmailBody(prevState => `${prevState} [${text}]`)
    } else if (focusedField["id"] == "emailSubject") {
      setEmailSubject(prevState => `${prevState} [${text}]`)
    }
  }

  useEffect(() => {
    document.title = "Email Template - New"
    $.validator.unobtrusive.parse($("#new-template-form"))
  }, [])

  const submitNewTemplateForm = async () => {
    if (!$("#new-template-form").valid()) {
      return
    }

    let data = {
      "name": templateNameRef.current.value,
      "notificationCategoryId": notificationCategoryRef.current.value,
      "subject": emailSubject,
      "body": emailBody
    }

    console.log(data)

    const response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/emails`, data)
    if (response.status == 200) {
      navigate("/notifications")
    }
  }


  return (
    <LayoutNoSidebar>
      <div className='container mb-3'>

        <div className='row justify-content-center'>
          <div className='col-lg-8'>

            <nav aria-label="breadcrumb">
              <ol className="breadcrumb py-3 my-0">
                <li className="breadcrumb-item font-xsm"><Link to={"/notifications"}>Notifications</Link></li>
                <li className="breadcrumb-item font-xsm"><Link to={"/notifications/email"}>Emails</Link></li>
                <li className="breadcrumb-item font-xsm"><Link to={"/notifications/email/templates"}>Templates</Link></li>
                <li className="breadcrumb-item active font-xsm" aria-current="page">New</li>
              </ol>
            </nav>

            <hr className="horizontal-divider" />
            <h5 className='py-3 mb-0 bold'>New email template</h5>

            <form id='new-template-form'>
              <div id='form-errors'>
              </div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Name</label>
                <input ref={templateNameRef}
                  data-val-required="Name is required."
                  name="project-name"
                  data-val="true"
                  className="form-control font-sm" />

                <span className="text-danger font-xsm" data-valmsg-for="project-name" data-valmsg-replace="true"></span>
              </div>


              <div className="mb-3 col-12">
                <label className="form-label font-sm">Notification Category</label>

                <select className='form-select font-sm' ref={notificationCategoryRef}>
                  {notificationCategories.map(value => {
                    return (
                      <option
                        key={value["id"]}
                        value={value["id"]}>
                        {value["name"]}
                      </option>
                    )
                  })}
                </select>
              </div>

              <div className='mb-3'>
                <label className="font-sm form-label">Text Selectors</label>
                <div>
                  <button type='button' className='font-sm btn-light btn border me-2 mb-2' onClick={e => addSelector(e.target.innerHTML)}>Project name</button>
                  <button type='button' className='font-sm btn-light btn border me-2 mb-2' onClick={e => addSelector(e.target.innerHTML)}>Milestone name</button>
                  <button type='button' className='font-sm btn-light btn border me-2 mb-2' onClick={e => addSelector(e.target.innerHTML)}>Project lead name</button>
                  <button type='button' className='font-sm btn-light btn border me-2 mb-2' onClick={e => addSelector(e.target.innerHTML)}>Project manager name</button>
                  <button type='button' className='font-sm btn-light btn border me-2 mb-2' onClick={e => addSelector(e.target.innerHTML)}>Notification category</button>
                  <button type='button' className='font-sm btn-light btn border me-2 mb-2' onClick={e => addSelector(e.target.innerHTML)}>Notification date created</button>
                </div>
                <span className='font-xsm'><i className='fa fa-circle-info'></i> Click on the selectors to add placeholders to the text fields.</span>
              </div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Subject</label>
                <input value={emailSubject}
                  id='emailSubject'
                  onFocus={e => setFocusedField(e.target)}
                  onInput={e => setEmailSubject(e.target.value)}
                  data-val-required="Subject is required."
                  name="subject"
                  data-val="true"
                  className="form-control font-sm" />

                <span className="text-danger font-xsm" data-valmsg-for="subject" data-valmsg-replace="true"></span>
              </div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">Body</label>
                <textarea
                  id='emailBody'
                  value={emailBody}
                  onFocus={e => setFocusedField(e.target)}
                  onInput={e => setEmailBody(e.target.value)}
                  data-val-required="Body is required."
                  name="body"
                  data-val="true"
                  className="form-control font-sm"
                  rows="10" ></textarea>
                <span className="text-danger font-xsm" data-valmsg-for="body" data-valmsg-replace="true"></span>
              </div>

              <button className='btn btn-primary font-sm me-2' type="button" onClick={submitNewTemplateForm}>Create template</button>
              <button className='btn btn-outline-dark font-sm' type="button">Cancel</button>

            </form>
          </div>
        </div>

      </div>
    </LayoutNoSidebar>
  )
}
