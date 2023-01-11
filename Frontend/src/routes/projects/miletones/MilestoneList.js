import React from 'react'
import axios from 'axios'
import { useEffect, useState } from 'react'
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { Link } from 'react-router-dom'
import { getAllMilestones } from '../../../services/ProjectService'
import { RowMilestone } from '../../../components/projects/RowMilestone'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import { ConsoleLogger } from '@microsoft/signalr/dist/cjs/Utils'

const SORT_OPTIONS = {
  "Date Created (Newest First)": "DATE_CREATED_DESC",
  "Date Created (Oldest First)": "DATE_CREATED_ASC",
  "Date Projected Start (Oldest First)": "DATE_PROJECTED_START_ASC",
  "Date Projected Start (Newest First)": "DATE_PROJECTED_START_DESC",
  "Date Projected End (Oldest First)": "DATE_PROJECTED_START_ASC",
  "Date Projected End (Newest First)": "DATE_PROJECTED_START_DESC",
  "Completion Progress (Highest First)": "PROGRESS_DESC",
  "Completion Progress (Lowest First)": "PROGRESS_ASC",
}

const FILTER_OPTIONS = {
  "ALL": "All",
  "NOT_STARTED": "Not Started",
  "ONGOING": "Ongoing",
  "OVERDUE_COMPLETION": "Overdue Completion",
  "AWAITING_PAYMENT": "Awaiting Payment",
  "PAID": "Paid",
  "OVERDUE_PAYMENT": "Overdue Payment"
}


export const MilestoneList = () => {
  const [projectDetails, setProjectDetails] = useState({})
  const dispatch = useDispatch()
  const { projectId } = useParams()
  const [allMilestones, setAllMilestones] = useState([])
  const [selectedFilter, setSelectedFilter] = useState(FILTER_OPTIONS["ALL"])
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState(SORT_OPTIONS["Date Projected Start (Newest First)"])

  useEffect(() => {
    // Populating the details on the page
    const populateBreadcrumb = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data
      setProjectDetails(projectDetails)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectDetails["id"]}`,
        "Milestones": ``,
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.MILESTONES
      }))

    }

    populateBreadcrumb()
    searchMilestones()
  }, [])


  useEffect(() => {
    searchMilestones()
  }, [query, selectedFilter, sort])

  const searchMilestones = async () => {
    let filterEnum = Object.keys(FILTER_OPTIONS).find(key => FILTER_OPTIONS[key] == selectedFilter)
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/search?query=${query}&scope=${filterEnum}&projectId=${projectId}&sort=${sort}`)
    console.log(response.data)
    setAllMilestones(response.data)
  }

  return (
    <LayoutSidebar>
      <div className="d-flex justify-content-between border-bottom flex-wrap">
        <div className="d-flex order-2 order-lg-1 flex-grow-1 flex-md-grow-1">
          {Object.keys(FILTER_OPTIONS).map(key => {
            return (
              <span className={`nav-link font-sm milestones-scope text-dark cursor-pointer ${selectedFilter == FILTER_OPTIONS[key] ? "active bold" : ""}`} onClick={e => setSelectedFilter(FILTER_OPTIONS[key])}>{FILTER_OPTIONS[key]}</span>
            )
          })}
        </div>

        {!projectDetails["isCompleted"] &&
          <div className="d-flex order-1 order-lg-2 col-12 col-lg-2 justify-content-end">
            <Link to={"new"} className="btn btn-primary no-decoration-on-hover my-1 font-sm pt-2 flex-grow-1 flex-lg-grow-0 h-wrap-content align-self-center w-auto" style={{ whiteSpace: "nowrap" }}>
              New Milestone
            </Link>
          </div>
        }
      </div>

      {/* Action bar for lg - xl screens */}
      <div className='py-2 border-bottom mb-3 d-flex flex-wrap d-none d-lg-flex d-xl-flex'>
        <div className='d-flex'>
          <input value={query} onInput={e => setQuery(e.target.value)} className="form-control font-sm w-auto me-lg-2 h-wrap-content align-self-center flex-grow-1 flex-lg-grow-0 w-auto" placeholder="Search" />
        </div>

        <div className='d-flex'>
          <select className="form-select font-sm w-auto h-wrap-content align-self-center flex-lg-grow-0 flex-grow-1 w-auto"
            value={sort}
            onChange={e => setSort(e.target.value)}
            aria-label="Default select example">

            {Object.keys(SORT_OPTIONS).map(value => {
              return (<option value={SORT_OPTIONS[value]}>{value}</option>)
            })}

          </select>
        </div>
      </div>

      {/* Action bar for xs - md screens */}
      <div className='py-2 border-bottom mb-2 d-flex flex-wrap d-lg-none d-sm-flex d-md-flex'>
        <div className='d-flex col-12 mb-2'>
          <input value={query} onInput={e => setQuery(e.target.value)} className="form-control font-sm w-auto me-lg-2 h-wrap-content align-self-center flex-grow-1 flex-lg-grow-0" placeholder="Search" />
        </div>

        <div className='d-flex col-12'>
          <select className="form-select font-sm w-auto h-wrap-content align-self-center flex-lg-grow-0 flex-grow-1" aria-label="Default select example">
            {Object.keys(SORT_OPTIONS).map(value => {
              return (<option value={SORT_OPTIONS[value]}>{value}</option>)
            })}
          </select>
        </div>
      </div>

      {allMilestones.length > 0 &&
        allMilestones.map(value => {
          return <RowMilestone
            key={value["id"]}
            details={value}
          />
        })
      }
    </LayoutSidebar >
  )
}
