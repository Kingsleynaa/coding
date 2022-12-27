import React, { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { getMilestoneById } from '../../../services/ProjectService'
import { dateFormat, dateFormatForInputField } from '../../../utils/CommonUtils'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import $, { get } from "jquery"
import moment from 'moment'
import { Alert } from '../../../components/Alert'

export const MilestoneEdit = () => {
  const dispatch = useDispatch()
  const { projectId, milestoneId } = useParams()
  const navigate = useNavigate()

  const [milestoneDetails, setMilestoneDetails] = useState({
    "name": "",
    "paymentAmount": 0,
    "dateProjectedStart": "",
    "dateProjectedEnd": "",
  })

  const [originalPaymentPercentage, setOriginalPaymentPercentage] = useState(0)

  const [paymentStatus, setPaymentStatus] = useState({})

  useEffect(() => {
    const loadPageInformation = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data

      let currentMilestoneDetails = await getMilestoneById(milestoneId)

      if (currentMilestoneDetails.paymentAmount == null) {
        currentMilestoneDetails.paymentAmount = 0
      }

      console.log(currentMilestoneDetails)
      setMilestoneDetails(currentMilestoneDetails)
      setOriginalPaymentPercentage(currentMilestoneDetails["paymentPercentage"])

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectId}`,
        "Milestones": `/projects/${projectId}/milestones`,
        [currentMilestoneDetails["name"]]: `/projects/${projectId}/milestones/${milestoneId}`,
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
    getPaymentInformation()

  }, [projectId, milestoneId])

  const getPaymentInformation = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/payment-information`)
    if (response.status == 200) {
      setPaymentStatus(response.data)
    }

    return response.data
  }

  // Enable valdiation on the form
  useEffect(() => {
    $.validator.unobtrusive.parse($("#edit-milestone-form"))
  }, [])


  const submitEditMilestoneForm = async () => {
    if (!$("#edit-milestone-form").valid()) {
      return
    }

    let paymentAmount = parseFloat(milestoneDetails["paymentAmount"])
    if (paymentAmount < 0) {
      $("#payment-error-msg").html("Payment amount must be more than 0")
      return
    }

    let currentFormErrors = []

    if (moment(milestoneDetails["dateProjectedEnd"]) < moment(milestoneDetails["dateProjectedStart"])) {
      currentFormErrors.push("Projected end date should be later than projected start date.")
    }

    let paymentStatus = await getPaymentInformation()
    let availablePaymentPercentage = paymentStatus["milestones"] / paymentStatus["total"] * 100
    if (paymentStatus["milestones"] == paymentStatus["total"]) {
      currentFormErrors.push(`Payment percentage should not exceed <span class="bold">${0}%</span>.`)
      $("#form-errors").html(
        Alert(currentFormErrors.join("<br/>"))
      )
      return
      return
    }

    console.log(availablePaymentPercentage)

    if (parseInt(milestoneDetails["paymentPercentage"]) > availablePaymentPercentage - originalPaymentPercentage) {
      currentFormErrors.push(`Payment percentage should not exceed <span class="bold">${availablePaymentPercentage - originalPaymentPercentage}%</span>.`)
      $("#form-errors").html(
        Alert(currentFormErrors.join("<br/>"))
      )
      return
    }

    if (currentFormErrors.length > 0) {
      $("#form-errors").html(
        Alert(currentFormErrors.join("<br/>"))
      )
      return
    }

    let updateMilestoneResponse = await axios.put(`${process.env.REACT_APP_API_SERVER}/api/milestones`, milestoneDetails)
    if (updateMilestoneResponse.status == 200) {
      navigate(`/projects/${projectId}/milestones/${milestoneId}`)
    }
  }

  const setDateActualStart = (e) => {
    if (e.target.value == "") {
      setMilestoneDetails(prevState => ({ ...prevState, dateActualStart: null }))
      return
    }

    setMilestoneDetails(prevState => ({ ...prevState, dateActualStart: e.target.value }))
  }

  const getAvailablePercentage = () => {
    return (100 - (paymentStatus["milestones"] / paymentStatus["total"] * 100 - originalPaymentPercentage))
  }

  return (
    <LayoutSidebar>
      <form className='col-lg-10' id='edit-milestone-form'>
        <h5 className="py-3 bold">Edit Milestone</h5>

        <div id="form-errors">
        </div>

        <div className="row">
          <div className="mb-3 col-12">
            <label className="form-label font-sm">Name</label>
            <input
              onChange={e => setMilestoneDetails(prevState => ({ ...prevState, name: e.target.value }))}
              data-val-required="Name is required."
              name="milestone-name"
              data-val="true"
              className="form-control font-sm"
              value={milestoneDetails["name"]}
            />
            <span className="text-danger font-xsm" data-valmsg-for="milestone-name" data-valmsg-replace="true"></span>
          </div>

          <div className='row'>
            <div className="mb-3 col-6">
              <label className="form-label font-sm">Payment Percentage (Optional)</label>
              <div className="input-group">
                <input
                  className="form-control font-sm"
                  data-val-range-min={0}
                  data-val-range-max={100}
                  data-val-range="Payment percentage should be in range of 0 - 100."
                  data-val="true"
                  data-val-regex-pattern="^\d+$"
                  data-val-regex="Payment percentage must be a positive integer."
                  onChange={e => setMilestoneDetails(prevState => ({ ...prevState, paymentPercentage: e.target.value }))}
                  value={milestoneDetails["paymentPercentage"]}
                  name='payment-percentage'
                  placeholder='0' />
                <div className="input-group-text font-sm">%</div>
              </div>
              <span className="text-danger font-xsm" data-valmsg-for="payment-percentage" data-valmsg-replace="true"></span>

              <ul className='mb-0 mt-2 ps-3'>
                <li>
                  <span className='font-sm'>Original Amount · <span className='bold'>{originalPaymentPercentage}%  (${originalPaymentPercentage / 100 * paymentStatus["total"]})</span></span>
                </li>
                <li>
                  <span className='font-sm'>Available Amount · <span className='bold'>{getAvailablePercentage()}%  (${getAvailablePercentage() / 100 * paymentStatus["total"]})</span></span>
                </li>
              </ul>
            </div>

          </div>
          <div className="mb-3 col-6">
            <label className="form-label font-sm">Projected Start Date</label>
            <input
              onChange={e => setMilestoneDetails(prevState => ({ ...prevState, dateProjectedStart: e.target.value }))}
              data-val-required="Projected start date is required."
              name="projected-start-date"
              data-val="true"
              type="date"
              className="form-control font-sm"
              value={dateFormatForInputField(milestoneDetails["dateProjectedStart"])} />
            <span className="text-danger font-xsm" data-valmsg-for="projected-start-date" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-6">
            <label className="form-label font-sm">Projected End Date</label>
            <input value={dateFormatForInputField(milestoneDetails["dateProjectedEnd"])}
              onChange={e => setMilestoneDetails(prevState => ({ ...prevState, dateProjectedEnd: e.target.value }))}
              data-val-required="Projected end date is required."
              name='projected-end-date'
              data-val="true"
              type="date"
              className="form-control font-sm" />
            <span className="text-danger font-xsm" data-valmsg-for="projected-end-date" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-12">
            <label className="form-label font-sm">Description</label>
            <textarea value={milestoneDetails["description"]}
              onChange={e => setMilestoneDetails(prevState => ({ ...prevState, description: e.target.value }))}
              data-val-required="Description is required."
              name="description"
              data-val="true"
              className="form-control font-sm"
              rows="5" ></textarea>
            <span className="text-danger font-xsm" data-valmsg-for="description" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-6">
            <label className="form-label font-sm">Actual Start Date (Optional)</label>
            <input
              onChange={e => setDateActualStart(e)}
              name="actual-start-date"
              data-val="true"
              type="date"
              className="form-control font-sm"
              value={dateFormatForInputField(milestoneDetails["dateActualStart"])} />
            <span className="text-danger font-xsm" data-valmsg-for="actual-start-date" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-3 col-6">
            <label className="form-label font-sm">Actual End Date (Optional)</label>
            <br />
            <span className="font-xsm"><i className='fa fa-circle-info'></i> The actual end date would be recorded as the day when all milestones of the project has been marked completed.</span>
          </div>
        </div>

        <button type="button" id="btn-save-changes" onClick={submitEditMilestoneForm} className="btn btn-primary font-sm me-2 mb-3">Save changes</button>
        <Link to={`/projects/${projectId}/milestones/${milestoneId}`} className="btn btn-outline-dark no-decoration-on-hover font-sm me-2 mb-3">Cancel</Link>

      </form>
    </LayoutSidebar>
  )
}
