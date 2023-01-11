import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import { RowMember } from '../../../components/projects/RowMember'
import { dateFormat } from '../../../utils/CommonUtils'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import axios from 'axios'
import { LayoutRisk } from '../../../layouts/LayoutRisk'
import { RiskStatus } from '../../../components/risks/RiskStatus'

const ALL = {
  "id": "ALL",
  "name": "ALL"
}

const SORT_OPTIONS = {
  "Risk Likelihood (Highest First)": "LIKELIHOOD_DESC",
  "Risk Likelihood (Lowest First)": "LIKELIHOOD_ASC",
  "Risk Severity (Highest First)": "SEVERITY_DESC",
  "Risk Severity (Lowest First)": "SEVERITY_ASC"
}

export const RiskList = () => {
  const dispatch = useDispatch()
  const { projectId } = useParams()
  const [projectDetails, setProjectDetails] = useState({})
  const [risks, setRisks] = useState([])
  const [selectedRisk, setSelectedRisk] = useState({})

  // Filters
  const [riskLikelihoods, setRiskLikelihoods] = useState([])
  const [riskSeverities, setRiskSeverities] = useState([])
  const [riskCategories, setRiskCategories] = useState([])

  // User selection
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(ALL)
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS["Risk Likelihood (Highest First)"])

  useEffect(() => {
    const loadPageData = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data
      setProjectDetails(projectDetails)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectDetails["id"]}`,
        "Risks": ``,
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
    setRiskCategories(riskCategoriesResponse.data)
  }

  useEffect(() => {
    searchRisk()
  }, [searchQuery, selectedCategory, selectedSort])

  const searchRisk = async () => {
    let searchResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/search?projectId=${projectId}&category=${selectedCategory["id"]}&query=${searchQuery}&sort=${selectedSort}`)

    if (searchResponse.status == 200) {
      setRisks(searchResponse.data)
    }
  }

  const deleteRisk = async (riskId) => {
    let response = await axios.delete(`${process.env.REACT_APP_API_SERVER}/api/projects/risks/${riskId}`)
    if (response.status == 200) {
      searchRisk()
    }
  }

  return (
    <LayoutRisk>
      <div className="d-flex justify-content-between border-bottom flex-wrap mb-lg-0">
        <div className="d-flex order-2 order-lg-1 flex-grow-1 flex-md-grow-1 col-12 col-lg-7">
          <a className={`nav-link font-sm milestones-scope text-dark ${selectedCategory["id"] == ALL["id"] ? "active bold" : ""}`} onClick={e => setSelectedCategory(ALL)}>All</a>

          {riskCategories.map(value => {
            return (<span className={`nav-link font-sm milestones-scope text-dark cursor-pointer ${selectedCategory["id"] == value["id"] ? "active bold" : ""}`} onClick={e => setSelectedCategory(value)}>{value["name"]}</span>)
          })}

        </div>

        <div className="d-flex order-1 flex-wrap flex-lg-nowrap flex-grow-1 justify-content-end">
          {!projectDetails["isCompleted"] &&
            <Link to={`/projects/${projectId}/risks/new`} className="btn btn-primary no-decoration-on-hover flex-grow-1 flex-lg-grow-0 my-1 font-sm h-wrap-content align-self-center" style={{ whiteSpace: "nowrap" }}>
              New Risk
            </Link>
          }
        </div>
      </div>


      <div className="justify-content-start d-flex border-bottom flex-wrap mb-sm-0 py-2">
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className='form-control font-sm w-auto flex-lg-grow-0 me-lg-2 flex-grow-1 mb-lg-0 mb-sm-2'
          placeholder='Search'></input>

        <select className='form-select font-sm w-auto flex-lg-grow-0 flex-grow-1 h-wrap-content' value={selectedSort} onChange={e => setSelectedSort(e.target.value)}>
          {Object.keys(SORT_OPTIONS).map(value => {
            return (
              <option value={SORT_OPTIONS[value]}>{value}</option>
            )
          })}
        </select>
      </div>

      <div className="border-bottom py-3 flex-wrap d-none d-lg-block mb-sm-0 mb-lg-2">
        <div className='row gx-5 px-3'>
          <div className='col-lg-4 font-sm bold'>Category</div>
          <div className='col-lg-1 font-sm bold'>Likelihood</div>
          <div className='col-lg-1 font-sm bold'>Severity</div>
          <div className='col-lg-3 font-sm bold'>Description</div>
          <div className='col-lg-3 font-sm bold'>Mitigation</div>
        </div>
      </div>

      {risks.map(value => {
        return (
          <div className='risk p-3 rounded-2 mb-4'>
            <div className="row gx-5 justify-content-between">
              <div className="col-12 col-lg-4 mb-2">
                <span className="my-0 bold font-sm text-dark">{value["category"]}</span>
                <p className="my-0 font-sm text-secondary">{value["definition"]}</p>
              </div>

              <div className="col-12 col-lg-1 mb-2">
                <span className='font-sm bold d-lg-none'>Likelihood:</span>
                <br className='d-lg-none' />
                <RiskStatus level={value["likelihood"]} />
              </div>

              <div className="col-12 col-lg-1 mb-2">
                <span className='font-sm bold d-lg-none'>Severity:</span>
                <br className='d-lg-none' />
                <RiskStatus level={value["severity"]} />
              </div>

              <div className="col-12 col-lg-3 mb-3">
                <span className='font-sm bold d-lg-none'>Description:</span>
                <br className='d-lg-none' />
                <span className='font-sm'>{value["description"]}</span>
              </div>

              <div className="col-12 col-lg-3">
                <span className='font-sm bold d-lg-none'>Mitigation:</span>
                <br className='d-lg-none' />
                <span className='font-sm'>{value["mitigation"]}</span>
              </div>
            </div>

            {!projectDetails["isCompleted"] &&
              <>
                <hr className='mt-lg-2' />

                <Link to={value["id"] + "/edit"} className='me-2 btn btn-outline-dark font-sm no-decoration-on-hover'>Edit</Link>
                <button className='me-2 btn btn-outline-danger font-sm' data-bs-toggle="modal" data-bs-target={"#removeModal"} onClick={e => setSelectedRisk(value)}>Remove</button>
              </>
            }
          </div>
        )
      })}

      <div class="modal fade" id={"removeModal"} tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h6 class="modal-title" id="exampleModalLabel">Are you sure?</h6>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body font-sm">
              You're about to permamently delete <span className='bold'>{selectedRisk["category"]}</span> risk.
              <br />
              This process is <span className='bold'>irreversible</span>.
              <br />
              <br />
              <span className='bold'>Description:</span>
              <p>{selectedRisk["description"]}</p>

              <span className='bold'>Mitigation:</span>
              <p>{selectedRisk["mitigation"]}</p>

            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Cancel</button>
              <button type="button" class="btn btn-danger font-sm" data-bs-dismiss="modal" onClick={e => deleteRisk(selectedRisk["id"])}>Delete risk</button>
            </div>
          </div>
        </div>
      </div>
    </LayoutRisk>
  )
}
