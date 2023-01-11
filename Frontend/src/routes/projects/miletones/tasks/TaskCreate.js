import React, { useCallback, useEffect, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LayoutSidebar } from '../../../../layouts/LayoutSidebar'
import axios from 'axios'
import { setBreadcrumbPath } from '../../../../redux/siteSlice'
import { setSidebarInformation } from '../../../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../../../components/SidebarProject'
import { getMilestoneById } from '../../../../services/ProjectService'
import Tags from '@yaireo/tagify/dist/react.tagify'
import "@yaireo/tagify/dist/tagify.css"
import $ from "jquery"
import "jquery-validation-unobtrusive"
import { tagTemplate, dropdownHeaderTemplate, suggestionItemTemplate } from '../../../../components/Tagify/TagifyTemplate'

export const TaskCreate = () => {
  const dispatch = useDispatch()
  const { projectId, milestoneId } = useParams()
  const navigate = useNavigate()
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

  // To populate the breadcrumb
  useEffect(() => {
    // Populating the details on the page
    const loadPageData = async () => {
      let projectResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectResponse.data

      let milestoneDetails = await getMilestoneById(milestoneId);

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectId}`,
        "Milestones": `/projects/${projectId}/milestones`,
        [milestoneDetails["name"]]: `/projects/${projectId}/milestones/${milestoneId}`,
        "New Task": ""
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.MILESTONES
      }))
    }
    loadPageData()
    loadMembers()
  }, [])


  const loadMembers = async () => {
    let projectMembersResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/members/search`, {
      "isProjectMember": true
    })

    // Programitically change the whitelist for tagify
    tagifyRef.current.settings.whitelist = projectMembersResponse.data
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


  const taskName = useRef()
  const taskDescription = useRef()

  // Submit create task form
  const submitNewTaskForm = async () => {
    if (!$("#new-task-form").valid()) {
      return
    }

    let userIdList = tagifyRef.current.value.map(x => x.value)

    let newTaskResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks`, {
      "name": taskName.current.value,
      "description": taskDescription.current.value,
      "milestoneId": milestoneId,
      "assignedToUserIdList": userIdList
    })

    if (newTaskResponse.status == 200) {
      navigate(`/projects/${projectId}/milestones/${milestoneId}`)
    }
  }


  // Initialize validation for milestone form on page load
  useEffect(() => {
    $.validator.unobtrusive.parse($("#new-task-form"))
  }, [])

  return (
    <LayoutSidebar>
      <h5 className='py-3 bold'>New Task</h5>

      <form className="col-lg-10" id="new-task-form">
        <div className="row">
          <div className="mb-3 col-12">
            <label className="form-label font-sm">Name</label>
            <input
              ref={taskName}
              data-val-required="Name is required."
              name="task-name"
              data-val="true"
              className="form-control font-sm" />
            <span className="text-danger font-xsm" data-valmsg-for="task-name" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-12">
            <label className="form-label font-sm">Description</label>
            <textarea
              ref={taskDescription}
              data-val-required="Description is required."
              name="task-description"
              data-val="true"
              className="form-control font-sm" rows="5"></textarea>
            <span className="text-danger font-xsm" data-valmsg-for="task-description" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-6">
            <label className="form-label font-sm">Assigned To (Optional)</label>
            <Tags
              className='form-control font-xsm'
              tagifyRef={tagifyRef} // optional Ref object for the Tagify instance itself, to get access to  inner-methods
              onDropdownSelect={onTagifyChange}
              onInput={onTagifyInput}
              settings={tagifySettings}
            />
          </div>

        </div>
        <button type="button" className="btn btn-primary font-sm me-2" onClick={submitNewTaskForm}>Create Task</button>
        <Link to={`/projects/${projectId}/milestones/${milestoneId}`} className="btn btn-outline-dark font-sm no-decoration-on-hover">Cancel</Link>
      </form>
    </LayoutSidebar>
  )
}
