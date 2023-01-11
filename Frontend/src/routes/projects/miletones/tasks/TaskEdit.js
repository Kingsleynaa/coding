import React, { useEffect, useRef, useState } from 'react'
import { useDispatch } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LayoutSidebar } from '../../../../layouts/LayoutSidebar'
import axios from 'axios'
import { setBreadcrumbPath } from '../../../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../../../components/SidebarProject'
import { setSidebarInformation } from '../../../../redux/siteSlice'
import { getMilestoneById } from '../../../../services/ProjectService'
import $ from "jquery"
import "jquery-validation-unobtrusive"

export const TaskEdit = () => {
  const dispatch = useDispatch()
  const { projectId, milestoneId, taskId } = useParams()
  const navigate = useNavigate()

  const [projectDetails, setProjectDetails] = useState({
    "id": "",
    "name": ""
  })

  const [taskDetails, setTaskDetails] = useState({})

  // Enable valdiation on the form
  useEffect(() => {
    $.validator.unobtrusive.parse($("#edit-task-form"))
  }, [])

  useEffect(() => {
    const loadPageInformation = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data
      setProjectDetails(projectDetails)

      let taskResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks/${taskId}`)
      let taskDetails = taskResponse.data
      setTaskDetails(taskResponse.data)

      let currentMilestoneDetails = await getMilestoneById(milestoneId)

      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectId}`,
        "Milestones": `/projects/${projectId}/milestones`,
        [currentMilestoneDetails["name"]]: `/projects/${projectId}/milestones/${milestoneId}/`,
        [taskDetails["name"]]: `/projects/${projectId}/milestones/${milestoneId}/${taskId}`,
        "Edit": ""
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.MILESTONES
      }))
    }

    loadPageInformation()

  }, [])

  const submitEditTaskForm = async () => {
    if (!$("#edit-task-form").valid()) {
      return
    }

    let updateTaskPayload = {
      "id": taskDetails.id,
      "name": taskDetails.name,
      "description": taskDetails.description
    }

    let updateTaskResponse = await axios.put(`${process.env.REACT_APP_API_SERVER}/api/milestones/tasks`, updateTaskPayload)
    if (updateTaskResponse.status == 200) {
      return navigate(`/projects/${projectId}/milestones/${milestoneId}/${taskId}`)
    }

  }

  return (
    <LayoutSidebar>
      <h5 className='py-3 bold'>Edit Task</h5>

      <form className='col-lg-10' id="edit-task-form">
        <div className="row">
          <div className="mb-3 col-12">
            <label className="form-label font-sm">Name</label>
            <input
              onChange={e => setTaskDetails(prevState => ({ ...prevState, name: e.target.value }))}
              value={taskDetails["name"]}
              data-val-required="Name is required."
              name="task-name"
              data-val="true"
              className="form-control font-sm" />
            <span className="text-danger font-xsm" data-valmsg-for="task-name" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-12">
            <label className="form-label font-sm">Description</label>
            <textarea
              onChange={e => setTaskDetails(prevState => ({ ...prevState, description: e.target.value }))}
              value={taskDetails["description"]}
              data-val-required="Description is required."
              name="task-description"
              data-val="true"
              className="form-control font-sm" rows="5"></textarea>
            <span className="text-danger font-xsm" data-valmsg-for="task-description" data-valmsg-replace="true"></span>
          </div>

        </div>
        <button type="button" className="btn btn-primary font-sm me-2" onClick={submitEditTaskForm}>Save Changes</button>
        <Link to={`/projects/${projectId}/milestones/${milestoneId}/${taskId}`} className="btn btn-outline-dark font-sm no-decoration-on-hover">Cancel</Link>
      </form>
    </LayoutSidebar>
  )
}
