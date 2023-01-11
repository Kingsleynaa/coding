import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from "react-router-dom"
import { LayoutNoSidebar } from '../../../layouts/LayoutNoSidebar'
import { useParams } from "react-router-dom"
import axios from 'axios'
import $ from "jquery"
import "jquery-validation-unobtrusive"
import { dateFormatWithTime } from '../../../utils/CommonUtils'
import Tags from '@yaireo/tagify/dist/react.tagify'
import "@yaireo/tagify/dist/tagify.css"
import { tagTemplate, dropdownHeaderTemplate, suggestionItemTemplate } from '../../../components/Tagify/TagifyTemplate'

const tagifySettings = {
  tagTextProp: 'name', // very important since a custom template is used with this property as text
  enforceWhitelist: true,
  skipInvalid: true, // do not remporarily add invalid tags
  dropdown: {
    closeOnSelect: false,
    enabled: 0,
    classname: 'users-list',
    searchKeys: ['name', 'email']  // very important to set by which keys to search for suggesttions when typing
  },
  templates: {
    tag: tagTemplate,
    dropdownItem: suggestionItemTemplate,
    dropdownHeader: dropdownHeaderTemplate
  },
  whitelist: []
}

export const SendEmail = () => {
  const { notificationId } = useParams()
  const [notification, setNotification] = useState({
    "notificationCategoryName": "",
    "notificationCategoryId": ""
  })

  const navigate = useNavigate()

  const [notificationCategories, setNotificationCategories] = useState([])
  const [emailBody, setEmailBody] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [focusedField, setFocusedField] = useState(null)


  const [emailTemplates, setEmailTemplates] = useState([])
  const [selectedEmailTemplate, setSelectedEmailTemplate] = useState("")

  const [projectLead, setProjectLead] = useState({})
  const [projectCreator, setProjectCreator] = useState({})

  const templateNameRef = useRef()
  const notificationCategoryRef = useRef()
  const [defaultUsers, setDefaultUsers] = useState([])

  const [userQuery, setUserQuery] = useState("")
  const tagifyRef = useRef()

  const [isSendingMail, setIsSendingMail] = useState(false)

  const onTagifyInput = useCallback(async (e) => {
    setUserQuery(e.detail.value)
  }, [])

  const onTagifyChange = useCallback((e) => {
    console.log(e.detail.elm.className, e.detail.elm.classList.contains(`${tagifyRef.current.settings.classNames.dropdownItem}__addAll`))

    if (e.detail.elm.classList.contains(`${tagifyRef.current.settings.classNames.dropdownItem}__addAll`)) {
      tagifyRef.current.dropdown.selectAll()
    }
  }, [])

  useEffect(() => {
    setDefaultUsers([
      {
        "value": projectCreator["id"],
        "email": projectCreator["email"],
        "name": `${projectCreator["name"]} • Project Creator`,
        "userId": projectCreator["id"]
      },
      {
        "value": projectLead["id"],
        "email": projectLead["email"],
        "name": `${projectLead["name"]} • Project Lead`,
        "userId": projectLead["id"]
      }]
    )
  }, [projectCreator, projectLead])

  useEffect(() => {
    tagifyRef.current.value = defaultUsers
  }, [defaultUsers])

  useEffect(() => {
    document.title = "Email - Send"
    console.log(notificationId)
    getNotification()
  }, [])

  useEffect(() => {
    const loadData = async () => {
      await getProjectCreator()
      await getProjectLead()
      await loadTemplates()
    }

    if (notification["notificationCategoryId"] != "") {
      loadData()
    }
  }, [notification])

  useEffect(() => {
    let targetedEmailTemplate = emailTemplates.find(x => x["id"] == selectedEmailTemplate)

    if (targetedEmailTemplate != null) {
      let body = replacePlaceholders(targetedEmailTemplate["body"])
      let subject = replacePlaceholders(targetedEmailTemplate["subject"])

      setEmailBody(body)
      setEmailSubject(subject)
    }

  }, [selectedEmailTemplate])

  const loadUsers = async () => {
    let payload = {
      query: userQuery,
      userIdList: [],
      resultSize: 10,
      resultPage: 0
    }

    console.log(payload)

    let usersResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/users/search`, payload)
    tagifyRef.current.settings.whitelist = usersResponse.data
  }

  useEffect(() => {
    loadUsers()
  }, [userQuery])

  const getProjectLead = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${notification["projectId"]}/project-lead`)

    if (response.status == 200) {
      setProjectLead(response.data)
    }
  }

  const getProjectCreator = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${notification["projectId"]}/creator`)

    if (response.status == 200) {
      setProjectCreator(response.data)
    }
  }

  const replacePlaceholders = (text) => {
    let result = text.replaceAll("[Project name]", notification["projectName"])

    if (notification["milestoneName"] == null) {
      result = result.replaceAll("[Milestone name]", "")
    } else {
      result = result.replaceAll("[Milestone name]", notification["milestoneName"])
    }

    if (projectLead["name"] == null) {
      result = result.replaceAll("[Project lead name]", "")
    } else {
      result = result.replaceAll("[Project lead name]", projectLead["name"])
    }

    result = result.replaceAll("[Project manager name]", projectCreator["name"])
    result = result.replaceAll("[Notification category]", notification["notificationCategoryName"])
    result = result.replaceAll("[Notification date created]", dateFormatWithTime(notification["dateCreated"]))

    return result
  }

  const getNotification = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/notifications/${notificationId}`)

    if (response.status == 200) {
      setNotification(response.data)
      console.log(response.data)
    }
  }

  const loadTemplates = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/emails/templates?category=${notification["notificationCategoryId"]}`)

    if (response.status == 200) {
      console.log(response.data)
      setEmailTemplates(response.data)

      if (response.data.length > 0) {
        setSelectedEmailTemplate(response.data[0]["id"])
      }
    }
  }

  const sendEmail = async () => {
    setIsSendingMail(true)

    let payload = {
      userIdList: tagifyRef.current.value.map(x => x.value),
      subject: emailSubject,
      body: emailBody,
      htmlContent: `
      ${emailBody.replaceAll("\n", "<br/>")}

      <br/>

      <span>View the project here <a clicktracking="off" href="http://localhost:3000/projects/${notification["projectId"]}">${notification["projectName"]}</a></span>
      `
    }

    let response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/emails/send`, payload)
    setIsSendingMail(false)
    if (response.status == 200) {
      navigate("/notifications")
    }
  }

  return (
    <LayoutNoSidebar>
      <div className='container'>
        <div className='row justify-content-center'>
          <div className='col-lg-8'>

            <nav aria-label="breadcrumb">
              <ol className="breadcrumb py-3 my-0">
                <li className="breadcrumb-item font-xsm"><Link to={"/notifications"}>Notifications</Link></li>
                <li className="breadcrumb-item font-xsm"><Link to={"/notifications/email"}>Emails</Link></li>
                <li className="breadcrumb-item font-xsm"><Link to={"/notifications/email/templates"}>Templates</Link></li>
                <li className="breadcrumb-item active font-xsm" aria-current="page">Send</li>
              </ol>
            </nav>

            <hr className="horizontal-divider" />
            <h5 className='py-3 mb-0 bold'>Send email for notification</h5>

            <form id='send-email-form'>

              <div className='row'>
                <div className='col-lg-4 mb-3'>
                  <label className='form-label font-sm'>Category</label>
                  <select disabled className='form-select font-sm'>
                    <option>{notification["notificationCategoryName"]}</option>
                  </select>
                </div>

                <div className='col-lg-4 mb-3'>
                  <label className='form-label font-sm'>Template</label>
                  <select className='form-select font-sm' value={selectedEmailTemplate} onChange={e => setSelectedEmailTemplate(e.target.value)}>
                    {emailTemplates.map(value => {
                      return (
                        <option value={value["id"]}>{value["name"]}</option>
                      )
                    })}
                  </select>
                </div>

              </div>

              <div className="mb-3 col-12">
                <label className="form-label font-sm">To</label>

                <Tags
                  className='form-control font-xsm'
                  tagifyRef={tagifyRef} // optional Ref object for the Tagify instance itself, to get access to  inner-methods
                  settings={tagifySettings}
                  onDropdownSelect={onTagifyChange}
                  onInput={onTagifyInput}
                  value={defaultUsers}
                />

              </div>


              <div className="mb-3 col-12">
                <label className="form-label font-sm">Subject</label>

                <input
                  value={emailSubject}
                  data-val-required="Name is required."
                  name="project-name"
                  data-val="true"
                  className="form-control font-sm" />

                <span className="text-danger font-xsm" data-valmsg-for="project-name" data-valmsg-replace="true"></span>

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

            </form>
            <button className='btn btn-primary font-sm me-2' id='btnSendEmail' onClick={sendEmail}>
              {isSendingMail &&
                <div className="spinner-border-sm spinner-border text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              }

              {!isSendingMail &&
                <span>
                  Send email
                </span>
              }

            </button>
            <button className='btn btn-outline-dark font-sm'>Cancel</button>
          </div>
        </div>
      </div >
    </LayoutNoSidebar >
  )
}
