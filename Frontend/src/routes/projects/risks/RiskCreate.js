import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import { RowMember } from '../../../components/projects/RowMember'
import { dateFormat } from '../../../utils/CommonUtils'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import axios from 'axios'
import moment from 'moment'
import { Alert } from '../../../components/Alert'
import $ from "jquery"
import "jquery-validation-unobtrusive"

export const RiskCreate = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { projectId } = useParams()

  useEffect(() => {
    const loadPageData = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectDetails["id"]}`,
        "Risks": `/projects/${projectId}/risks`,
        "New": ""
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.RISKS
      }))
    }

    loadPageData()
    populateRiskOptions()
  }, [])

  const populateRiskOptions = async () => {
    let riskLikelihoodResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/likelihoods`)
    setRiskLikelihoods(riskLikelihoodResponse.data)

    let riskSeveritiesResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/severities`)
    setRiskSeverities(riskSeveritiesResponse.data)

    let riskCategoriesResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/categories`)

    riskDefinition.current.innerHTML = riskCategoriesResponse.data[0].definition
    setRiskCategory(riskCategoriesResponse.data[0].id)
    setRiskCategories(riskCategoriesResponse.data)

    console.log(riskDefinition)
  }

  // Initialize validation for milestone form on page load
  useEffect(() => {
    $.validator.unobtrusive.parse($("#new-risk-form"))
  }, [])

  const submitCreateRiskForm = async () => {
    if (!$("#new-risk-form").valid()) {
      return
    }

    let data = {
      "categoryId": riskCategory,
      "severityId": riskSeverity.current.value,
      "likelihoodId": riskLikelihood.current.value,
      "description": riskDescription.current.value,
      "mitigation": riskMitigation.current.value,
      "projectId": projectId
    }

    console.log(data)

    let response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/risks`, data)
    if (response.status == 200) {
      navigate(`/projects/${projectId}/risks`)
    }
  }

  // Risk
  const [riskLikelihoods, setRiskLikelihoods] = useState([])
  const [riskSeverities, setRiskSeverities] = useState([])
  const [riskCategories, setRiskCategories] = useState([])

  const [riskCategory, setRiskCategory] = useState()
  const riskDescription = useRef()
  const riskSeverity = useRef()
  const riskLikelihood = useRef()
  const riskMitigation = useRef()
  const riskDefinition = useRef()

  useEffect(() => {
    if (riskCategory != null && riskCategories != null) {
      for (var i in riskCategories) {
        if (riskCategories[i].id == riskCategory) {
          riskDefinition.current.innerHTML = riskCategories[i].definition
        }
      }
    }
  }, [riskCategory])

  return (
    <LayoutSidebar>
      <form className='col-lg-10' id='new-risk-form'>
        <h5 className="py-3 bold">New Risk</h5>

        <div id="form-errors">
        </div>

        <div className="row">

          <div className="mb-1 col-12">
            <label className='form-label font-sm'>Category</label>
            <select className='form-select font-sm' value={riskCategory} onChange={e => setRiskCategory(e.target.value)}>
              {riskCategories.length > 0 &&
                <option selected value={riskCategories[0].id}>{riskCategories[0].name}</option>
              }

              {riskCategories.slice(1).map(value => {
                return (
                  <option value={value.id}>{value.name}</option>
                )
              })}
            </select>
          </div>

          <div className="mb-3 col-12">
            <i className='fa fa-circle-info me-2'></i>
            <span className='font-xsm'
              ref={riskDefinition}></span>
          </div>

          <div className="mb-3 col-12">
            <label className="form-label font-sm">Description</label>
            <textarea
              data-val-required="Description is required."
              name="description"
              data-val="true"
              className="form-control font-sm"
              rows="5"
              ref={riskDescription}></textarea>
            <span className="text-danger font-xsm" data-valmsg-for="description" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-1 col-lg-6 col-sm-12">
            <label className='form-label font-sm'>Likelihood</label>
            <select className='form-select font-sm' ref={riskLikelihood}>
              {riskLikelihoods.map(value => {
                return (
                  <option value={value.id}>{value.name}</option>
                )
              })}
            </select>
          </div>

          <div className="mb-1 col-lg-6 col-sm-12">
            <label className='form-label font-sm'>Severity</label>
            <select className='form-select font-sm' ref={riskSeverity}>
              {riskSeverities.map(value => {
                return (
                  <option value={value.id}>{value.name}</option>
                )
              })}
            </select>
          </div>

          <div className="mb-3 col-12">
            <label className="form-label font-sm">Mitigation</label>
            <textarea
              data-val-required="Mitigation is required."
              name="mitigation"
              data-val="true"
              className="form-control font-sm"
              rows="5"
              ref={riskMitigation}></textarea>
            <span className="text-danger font-xsm" data-valmsg-for="mitigation" data-valmsg-replace="true"></span>
          </div>

        </div>

        <Link to={`/projects/${projectId}/risks`} className="btn btn-outline-dark font-sm me-2 no-decoration-on-hover" type="button">Cancel</Link>
        <button className="btn btn-primary font-sm" onClick={submitCreateRiskForm} type="button">Add Risk</button>

      </form>
    </LayoutSidebar >
  )
}
