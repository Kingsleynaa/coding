import React, { useEffect, useState, useRef, useCallback } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutSidebar } from '../../../../layouts/LayoutSidebar'
import axios from 'axios'
import { getMilestoneById } from '../../../../services/ProjectService'
import { setBreadcrumbPath } from '../../../../redux/siteSlice'
import { setSidebarInformation } from '../../../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../../../components/SidebarProject'
import { Link } from 'react-router-dom'
import { dateFormat } from '../../../../utils/CommonUtils'
import { RowMember } from '../../../../components/projects/RowMember'
import Tags from "@yaireo/tagify/dist/react.tagify"
import "@yaireo/tagify/dist/tagify.css"
import { tagTemplate, dropdownHeaderTemplate, suggestionItemTemplate } from '../../../../components/Tagify/TagifyTemplate'

export const TaskDetails = () => {
  const dispatch = useDispatch()
  const { projectId, milestoneId, taskId } = useParams()
  const navigate = useNavigate()
  const [taskDetails, setTaskDetails] = useState({
    "id": "",
    "name": "",
    "dateCreated": "",
    "description": ""
  })

  const [milestoneDetails, setMilestoneDetails] = useState({})
  const [taskMembers, setTaskMembers] = useState([])

  const tagifyRef = useRef()

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

  const loadMilestoneDetails = async () => {
    let currentMilestoneDetails = await getMilestoneById(milestoneId)
    setMilestoneDetails(currentMilestoneDetails)
  }

  const onTagifyChange = useCallback((e) => {
    console.log(e.detail.elm.className, e.detail.elm.classList.contains(`${tagifyRef.current.settings.classNames.dropdownItem}__addAll`))

    if (e.detail.elm.classList.contains(`${tagifyRef.current.settings.classNames.dropdownItem}__addAll`)) {
      tagifyRef.current.dropdown.selectAll()
    }
  }, [])

  const onTagifyInput = useCallback(async (e) => {
    let userInput = e.detail.value // a string representing the tags

    let searchResultsResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/members/search`, {
      "isProjectMember": false,
      "query": userInput
    })

    tagifyRef.current.settings.whiteSpace = searchResultsResponse.data

  }, [])

  // Load page data
  useEffect(() => {
    const loadPageData = async () => {
      let projectResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectResponse.data

      let milestoneDetails = await getMilestoneById(milestoneId);

      let taskResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskId}`)
      let taskDetails = taskResponse.data

      setTaskDetails(taskDetails)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectId}`,
        "Milestones": `/projects/${projectId}/milestones`,
        [milestoneDetails["name"]]: `/projects/${projectId}/milestones/${milestoneId}`,
        [taskDetails["name"]]: ""
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.MILESTONES
      }))
    }

    loadPageData()
    loadMilestoneDetails()
    loadMembers()
  }, [])


  const loadTask = async () => {
    let taskResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskId}`)
    let taskDetails = taskResponse.data
    setTaskDetails(taskDetails)
  }

  const loadMembers = async () => {

    let taskMembersResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskId}/members`)
    setTaskMembers(taskMembersResponse.data)

    let projectMembersResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskId}/members?isAssignedToTask=false`)
    console.log(projectMembersResponse)
    // Programitically change the whitelist for tagify
    tagifyRef.current.settings.whitelist = projectMembersResponse.data
  }

  const deleteTask = async () => {
    let deleteTaskResponse = await axios.delete(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskDetails["id"]}`)

    if (deleteTaskResponse.status == 200) {
      return navigate(`/projects/${projectId}/milestones/${milestoneId}`)
    }
  }

  const addMembersToTask = async () => {
    if (tagifyRef.current.value.length == 0) {
      return
    }

    let addMembersPayload = {
      "userIdList": tagifyRef.current.value.map(x => x.value),
      "taskId": taskDetails["id"]
    }

    let addMembersResponse = await axios.put(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskDetails["id"]}/members`, addMembersPayload)
    if (addMembersResponse.status == 200) {
      tagifyRef.current.removeAllTags()
      loadMembers()
    }
  }

  const removeMember = async (userId) => {
    let removeMemberResponse = await axios.delete(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskId}/members/${userId}`)
    if (removeMemberResponse.status == 200) {
      tagifyRef.current.removeAllTags()
      loadMembers()
    }
  }

  const markTaskAsCompleted = async () => {
    let markTaskAsCompleteResponse = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskDetails["id"]}/mark-as-completed`)
    if (markTaskAsCompleteResponse.status == 200) {
      loadTask()
    }
  }

  const unmarkTaskAsCompleted = async () => {
    let unmarkTaskAsCompleteResponse = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskDetails["id"]}/unmark-as-completed`)
    if (unmarkTaskAsCompleteResponse.status == 200) {
      loadTask()
    }
  }

  return (
    <LayoutSidebar>
      <div className="py-3 border-bottom d-flex justify-content-between flex-wrap flex-lg-nowrap">
        <div className="d-flex align-items-center">
          {taskDetails["isCompleted"] &&
            <span className="badge bg-success h-fit-content me-2">Completed</span>
          }

          {!taskDetails["isCompleted"] &&
            <span className="badge bg-primary text-white h-fit-content me-2">Ongoing</span>
          }
          <h6 className="mb-0 font-sm">Created on {dateFormat(taskDetails["dateCreated"])}</h6>
        </div>

        {!milestoneDetails["isCompleted"] &&
          <div className="d-flex flex-grow-1 flex-sm-grow-0 flex-lg-grow-0 flex-md-grow-0 mt-2 mt-lg-0">
            <Link to={"edit"} className="btn-outline-dark btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0 me-2">Edit</Link>

            {!taskDetails["isCompleted"] &&
              <button className="btn-outline-dark btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0 me-2" style={{ whiteSpace: "nowrap" }} onClick={e => markTaskAsCompleted()}>Mark as completed</button>
            }

            {taskDetails["isCompleted"] &&
              <button className="btn-outline-dark btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0 me-2" style={{ whiteSpace: "nowrap" }} onClick={e => unmarkTaskAsCompleted()}>Unmark as completed</button>
            }

            <button className="btn-danger btn font-sm h-fit-content flex-grow-1 flex-lg-grow-0" data-bs-toggle="modal" data-bs-target="#exampleModal">Delete</button>
          </div>
        }

      </div>

      {/* Delete confirmation modal */}
      <div class="modal fade" id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title" id="exampleModalLabel">Are you sure</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body font-sm">
              You're about to permamently delete task <span className='bold'>{taskDetails["name"]}</span>.
              <br />
              This process is irreversible.
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger font-sm" onClick={deleteTask} data-bs-dismiss="modal">Delete task</button>
            </div>
          </div>
        </div>
      </div>

      <div className="py-3 border-bottom">
        <h4 className='bold'>{taskDetails["name"]}</h4>
        <p className="font-sm text-secondary mb-4">Task ID: {taskDetails["id"]}</p>

        <p className="font-sm">{taskDetails["description"]}</p>
      </div>

      <div className="d-flex justify-content-between border-bottom mb-3 flex-wrap">
        <div className="d-flex order-2 order-lg-1 flex-grow-1 flex-md-grow-1 col-sm-12 col-lg-6">
          <a className="nav-link font-sm milestones-scope bold text-dark active" href="/Projects/Milestones">Assigned To</a>
        </div>

        <div className="d-flex order-1 flex-wrap flex-lg-nowrap flex-grow-1 col-sm-12 col-lg-3 justify-content-end">
          {/* 
          <input className="form-control font-sm my-1 flex-grow-1 me-lg-2 h-wrap-content align-self-center" placeholder="Search by member names" />
           */}

          {!milestoneDetails["isCompleted"] &&
            <button data-bs-toggle="modal" data-bs-target="#inviteMembers" className="btn btn-primary no-decoration-on-hover w-fit-content my-1 font-sm pt-2 h-wrap-content align-self-center" style={{ whiteSpace: "nowrap" }}>
              Assign members
            </button>
          }

        </div>
      </div>

      <div className="modal fade" id="inviteMembers" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title" id="exampleModalLabel">Assign members to task</h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <label className='form-label font-sm'>Name or email address</label>

              <Tags
                className='form-control font-xsm'
                tagifyRef={tagifyRef} // optional Ref object for the Tagify instance itself, to get access to  inner-methods
                onDropdownSelect={onTagifyChange}
                onInput={onTagifyInput}
                settings={tagifySettings}
              />

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Close</button>
              <button type="button" onClick={addMembersToTask} className="btn btn-primary font-sm" data-bs-dismiss="modal">Assign Member(s)</button>
            </div>
          </div>
        </div>
      </div>

      {taskMembers.map(member => {
        return (
          <div className='milestone'>
            <div className="row mb-3 justify-content-between">
              <div className="col-12 col-lg-5">
                <Link to={""} className="my-0 bold font-sm text-dark">{member["name"]}</Link>
                <p className="my-0 font-sm text-secondary">{member["email"]}</p>
              </div>

              <div className="col-12 col-lg-2">
                <span className='badge rounded-pill bg-light text-dark' style={{ fontWeight: 500 }}>{member["role"]}</span>
              </div>

              <div className="col-12 col-lg-2">
                <span className='font-sm text-secondary'>Assigned on {dateFormat(member["dateAssigned"])}</span>
              </div>

              <div className='col-12 col-lg-2 text-end'>
                <button className='btn btn-outline-danger font-xsm' data-bs-toggle="modal" data-bs-target={`#delete${member["value"]}`} >Remove</button>
              </div>
            </div>

            <div className="modal fade" id={`delete${member["value"]}`} tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h6 className="modal-title" id="exampleModalLabel">Are you sure</h6>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div className="modal-body font-sm">
                    You're about to remove <span className='bold'>{member["name"]}</span> from the task <span className='bold'>{taskDetails["name"]}</span>.
                    <br />
                    <br />
                    If you change your mind later on, you still can assign <span className='bold'>{taskDetails["name"]}</span> to <span className='bold'>{member["name"]}</span>.
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Close</button>
                    <button type="button" onClick={e => removeMember(member["value"])} className="btn btn-danger font-sm" data-bs-dismiss="modal">Remove member</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}

    </LayoutSidebar>
  )
}
