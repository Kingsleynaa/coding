import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import { dateFormat } from '../../../utils/CommonUtils'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import axios from 'axios'
import $ from "jquery"

export const RiskEdit = () => {
  const dispatch = useDispatch()
  const { projectId, riskId } = useParams()
  const navigate = useNavigate()

  const [projectDetails, setProjectDetails] = useState({
    "id": "",
    "name": ""
  })

  const [riskDetails, setRiskDetails] = useState({})

  useEffect(() => {
    const loadPageData = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data

      let riskDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/${riskId}`)
      let riskDetails = riskDetailsResponse.data
      console.log(riskDetails)
      setRiskDetails(riskDetailsResponse.data)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectDetails["id"]}`,
        "Risks": `/projects/${projectDetails["id"]}/risks`,
        "Edit": ""
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

  useEffect(() => {
    $.validator.unobtrusive.parse($("#edit-risk-form"))
  }, [])

  const populateRiskOptions = async () => {
    let riskLikelihoodResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/likelihoods`)
    setRiskLikelihoods(riskLikelihoodResponse.data)

    let riskSeveritiesResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/severities`)
    setRiskSeverities(riskSeveritiesResponse.data)

    let riskCategoriesResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/categories`)
    setRiskCategories(riskCategoriesResponse.data)
  }

  const [riskLikelihoods, setRiskLikelihoods] = useState([])
  const [riskSeverities, setRiskSeverities] = useState([])
  const [riskCategories, setRiskCategories] = useState([])
  const riskDefinition = useRef()

  useEffect(() => {
    if (riskDetails["riskCategoryId"] != null && riskCategories != null) {
      for (var i in riskCategories) {
        if (riskCategories[i].id == riskDetails["riskCategoryId"]) {
          riskDefinition.current.innerHTML = riskCategories[i].definition
        }
      }
    }
  }, [riskDetails, riskCategories])

  const submitEditRiskForm = async () => {
    if (!$("#edit-risk-form").valid()) {
      return
    }

    let data = {
      "riskCategoryId": riskDetails["riskCategoryId"],
      "riskSeverityId": riskDetails["riskSeverityId"],
      "riskLikelihoodId": riskDetails["riskLikelihoodId"],
      "description": riskDetails["description"],
      "mitigation": riskDetails["mitigation"],
    }

    let updateRiskResponse = await axios.put(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/${riskId}`, data)

    if (updateRiskResponse.status == 200) {
      navigate(`/projects/${projectId}/risks`)
    }
  }

  return (
    <LayoutSidebar>
      <form className='col-lg-10' id="edit-risk-form">
        <h5 className='py-3 bold'>Edit Risk</h5>

        <div id="form-errors">
        </div>

        <div className='row'>

          <div className="mb-1 col-12">
            <label className='form-label font-sm'>Category</label>
            <select className='form-select font-sm' value={riskDetails["riskCategoryId"]} onChange={e => setRiskDetails(prevState => ({ ...prevState, riskCategoryId: e.target.value }))}>
              {riskCategories.map(value => {
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
              onInput={e => setRiskDetails(prevState => ({ ...prevState, description: e.target.value }))}
              value={riskDetails["description"]}></textarea>
            <span className="text-danger font-xsm" data-valmsg-for="description" data-valmsg-replace="true"></span>
          </div>

          <div className="mb-1 col-lg-6 col-sm-12">
            <label className='form-label font-sm'>Likelihood</label>
            <select className='form-select font-sm' value={riskDetails["riskLikelihoodId"]} onChange={e => setRiskDetails(prevState => ({ ...prevState, riskLikelihoodId: e.target.value }))} >
              {riskLikelihoods.map(value => {
                return (
                  <option value={value.id}>{value.name}</option>
                )
              })}
            </select>
          </div>

          <div className="mb-1 col-lg-6 col-sm-12">
            <label className='form-label font-sm'>Severity</label>
            <select className='form-select font-sm' value={riskDetails["riskSeverityId"]} onChange={e => setRiskDetails(prevState => ({ ...prevState, riskSeverityId: e.target.value }))} >
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
              onInput={e => setRiskDetails(prevState => ({ ...prevState, mitigation: e.target.value }))}
              rows="5"
              value={riskDetails["mitigation"]}></textarea>
            <span className="text-danger font-xsm" data-valmsg-for="mitigation" data-valmsg-replace="true"></span>
          </div>
        </div>

        <Link to={`/projects/${projectId}/risks`} className="btn btn-outline-dark font-sm me-2 no-decoration-on-hover" type="button">Cancel</Link>
        <button className="btn btn-primary font-sm" onClick={submitEditRiskForm} type="button">Save Changes</button>

      </form>
    </LayoutSidebar>
  )
}
