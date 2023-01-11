import React from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { createMilestone } from '../../../services/ProjectService'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import moment from 'moment'
import { Alert } from '../../../components/Alert'
import $ from "jquery"
import "jquery-validation-unobtrusive"


export const MilestoneCreate = () => {
  const dispatch = useDispatch()
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [projectDetails, setProjectDetails] = useState({})
  const [paymentStatus, setPaymentStatus] = useState({})
  const [originalPaymentPercentage, setOriginalPaymentPercentage] = useState(0)

  // Form fields 
  const milestoneName = useRef("")
  const paymentPercentage = useRef(0)
  const projectedStartDate = useRef("")
  const projectedEndDate = useRef("")
  const milestoneDescription = useRef("")
  const actualStartDate = useRef()

  // Initialize validation for milestone form on page load
  useEffect(() => {
    $.validator.unobtrusive.parse($("#new-milestone-form"))
  }, [])

  const submitCreateMilestoneForm = async () => {
    if (!$("#new-milestone-form").valid()) {
      return
    }

    let currentFormErrors = []

    if (moment(projectedEndDate.current.value) < moment(projectedStartDate.current.value)) {
      currentFormErrors.push("Projected end date should be later than projected start date.")
    }

    if (currentFormErrors.length > 0) {
      $("#form-errors").html(
        Alert(currentFormErrors.join("<br/>"))
      )
      return
    }

    let paymentStatus = await getPaymentInformation()
    let availablePaymentPercentage = 100 - (paymentStatus["milestones"] / paymentStatus["total"] * 100)

    if (parseInt(paymentPercentage.current.value) > availablePaymentPercentage) {
      currentFormErrors.push(`Payment percentage should not exceed <span class="bold">${availablePaymentPercentage}%</span>.`)
      $("#form-errors").html(
        Alert(currentFormErrors.join("<br/>"))
      )
      return
    }

    let milestoneDetails = {
      projectId: projectId,
      name: milestoneName.current.value,
      description: milestoneDescription.current.value,
      dateProjectedStart: projectedStartDate.current.value,
      dateProjectedEnd: projectedEndDate.current.value,
    }

    if (paymentPercentage.current.value.trim() == "") {
      milestoneDetails["paymentPercentage"] = 0
    } else {
      milestoneDetails["paymentPercentage"] = parseInt(paymentPercentage.current.value)
    }

    if (moment(actualStartDate.current.value).isValid()) {
      milestoneDetails["dateActualStart"] = actualStartDate.current.value
    }

    let isMilestoneCreated = await createMilestone(milestoneDetails)
    if (isMilestoneCreated) {
      navigate(`/projects/${projectId}/milestones`)
    }
  }

  // To populate the breadcrumb
  useEffect(() => {
    // Populating the details on the page
    const retrieveProjectDetails = async () => {
      let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = response.data
      setProjectDetails(projectDetails)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectId}`,
        "Milestones": `/projects/${projectId}/milestones`,
        "New": ``
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.MILESTONES
      }))
    }

    retrieveProjectDetails()
    getPaymentInformation()
  }, [])

  const getPaymentInformation = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/payment-information`)
    if (response.status == 200) {
      setPaymentStatus(response.data)
    }

    return response.data
  }

  const getAvailablePercentage = () => {
    return (100 - (paymentStatus["milestones"] / paymentStatus["total"] * 100))
  }

  return (
    <LayoutSidebar>
      <form className="col-lg-10" id="new-milestone-form">
        <h5 className="py-3 bold">New Milestone</h5>

        <div id="form-errors">
        </div>

        <div className="row">
          <div className="mb-3 col-12">
            <label className="form-label font-sm">Name</label>
            <input
              data-val-required="Name is required."
              name="milestone-name"
              data-val="true"
              className="form-control font-sm"
              ref={milestoneName}
            />
            <span className="text-danger font-xsm" data-valmsg-for="milestone-name" data-valmsg-replace="true"></span>
          </div>

          <div className='row'>
            <div className="mb-3 col-6">
              <label className="form-label font-sm">Payment Percentage (Optional)</label>
              <br />
              <div className="input-group">
                <input
                  className="form-control font-sm"
                  data-val-range-min={0}
                  data-val-range-max={100}
                  data-val-range="Payment percentage should be in range of 0 - 100."
                  data-val="true"
                  data-val-regex-pattern="^\d+$"
                  data-val-regex="Payment percentage must be a positive integer."
                  ref={paymentPercentage}
                  name='payment-percentage'
                  placeholder='0' />
                <div className="input-group-text font-sm">%</div>
              </div>
              <span className="text-danger font-xsm" data-valmsg-for="payment-percentage" data-valmsg-replace="true"></span>

              <ul className='mb-0 mt-2 ps-3'>
                <li>
                  <span className='font-sm'>Available Amount · <span className='bold'>{getAvailablePercentage()}%  (${getAvailablePercentage() / 100 * paymentStatus["total"]})</span></span>
                </li>
              </ul>
            </div>


          </div>
          <div className="mb-3 col-lg-6 col-sm-12">
            <label className="form-label font-sm">Projected Start Date</label>
            <input
              data-val-required="Projected start date is required."
              name="projected-start-date"
              data-val="true"
              type="date"
              className="form-control font-sm"
              ref={projectedStartDate} />
            <span className="text-danger font-xsm" data-valmsg-for="projected-start-date" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-lg-6 col-sm-12">
            <label className="form-label font-sm">Projected End Date</label>
            <input type="date"
              className="form-control font-sm"
              ref={projectedEndDate}
              data-val-required="Projected end date is required."
              name='projected-end-date'
              data-val="true" />
            <span className="text-danger font-xsm" data-valmsg-for="projected-end-date" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-12">
            <label className="form-label font-sm">Description</label>
            <textarea
              data-val-required="Description is required."
              name="description"
              data-val="true"
              className="form-control font-sm"
              rows="5"
              ref={milestoneDescription}></textarea>
            <span className="text-danger font-xsm" data-valmsg-for="description" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-6">
            <label className="form-label font-sm">Actual Start Date (Optional)</label>
            <input type="date"
              className="form-control font-sm"
              ref={actualStartDate}
              name='actual-start-date'
              data-val="true" />
            <span className="text-danger font-xsm" data-valmsg-for="actual-start-date" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-6">
            <label className="form-label font-sm">Actual End Date (Optional)</label>
            <br />
            <span className="font-xsm"><i className='fa fa-circle-info'></i> The actual end date would be recorded as the day when all milestones of the project has been marked completed.</span>
          </div>

        </div>

        <button className="btn btn-primary font-sm" onClick={submitCreateMilestoneForm} type="button">Create Milestone</button>
      </form>
    </LayoutSidebar>
  )
}
