import axios from 'axios'
import moment from 'moment'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { LayoutSidebar } from '../../layouts/LayoutSidebar'
import { dateFormat, dateFormatForInputField } from '../../utils/CommonUtils'
import { useDispatch, useSelector } from 'react-redux'
import { setBreadcrumbPath, setSidebarInformation } from '../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../components/SidebarProject'
import $, { data } from "jquery"
import { ProjectStatus } from '../../components/projects/ProjectStatus'
import * as humanDate from "human-date"
import ReactCalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css';
import ReactTooltip from 'react-tooltip'
import azureDevOpsLogo from "../../devops.png"
import { ProjectCompletionMarker } from '../../components/projects/ProjectCompletionMarker'

import { ChartFunction } from './miletones/ChartFunction';

import { GenerateReport } from './GenerateReport'


export const ProjectDetails = () => {
  const dispatch = useDispatch()

  const { projectId } = useParams()

  const [projectDetails, setProjectDetails] = useState({
    "id": "",
    "name": "",
    "description": ""
  })


  const [latestCommit, setLatestCommit] = useState(null)
  const [projectStatus, setProjectStatus] = useState("")
  const [heatmap, setHeatmap] = useState([])
  const [paymentProgress, setPaymentProgress] = useState(0)
  const [milestoneList, setMilestoneList] = useState({
    "id": "",
    "name": ""
  })



  const [selected, setSelected] = useState()





  const [Hidestate, setHideState] = useState(false)


  useEffect(() => {
    //Getting all milestone data
    const getmilestoneList = async () => {
      let resp = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/milestones`)
      let milestoneList = resp.data
      setMilestoneList(milestoneList)
    }
    // Populating the details on the page
    const loadPageData = async () => {
      let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = response.data
      setProjectDetails(projectDetails)
      console.log(projectDetails)
      document.title = projectDetails["name"]

      // Getting the project status
      let projectStatusResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/status`)
      setProjectStatus(projectStatusResponse.data)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: ""

      }))

      // Setting the projectDetails
      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.INFORMATION
      }
      ))
    }


    loadPageData()
    getPaymentInformation()
    getmilestoneList()
  }, [projectId])

  const handler = useCallback((evt) => {
    setSelected(milestoneList[evt.target.value]);
  }, [milestoneList, setSelected]);


  useEffect(() => {
    if (projectDetails["azureProjectId"] != null) {
      getLatestCommit()
      getHeatmap()

    }
  }, [projectDetails])

  const getLatestCommit = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/azure-dev-ops/${projectDetails["azureProjectId"]}/commits?take=1&skip=0&isHeatmapData=false`)
    if (response.status == 200) {
      setLatestCommit(response.data[0])
    }
  }

  const getHeatmap = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/azure-dev-ops/${projectDetails["azureProjectId"]}/commits?isHeatmapData=true`)
    if (response.status == 200) {
      setHeatmap(response.data)
    }
  }

  const totalPaymentRef = useRef()
  const paidPaymentRef = useRef()
  const outstandingPaymentRef = useRef()



  const getPaymentInformation = async () => {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/payment-information`)
    if (response.status == 200) {
      try {
        let paymentProgress = response.data["paid"] / response.data["total"]
        setPaymentProgress(paymentProgress)
      } catch (e) {
        setPaymentProgress(0)
      }

      totalPaymentRef.current.innerHTML = `$${response.data["total"]}`
      paidPaymentRef.current.innerHTML = `$${response.data["paid"]}`
      outstandingPaymentRef.current.innerHTML = `$${response.data["outstanding"]}`
    }
  }

  return (


    <LayoutSidebar>
      <ProjectCompletionMarker isCompleted={projectDetails["isCompleted"]} />

      <h4 className="mt-3 bold d-flex">
        <span className='align-self-center me-2 d-flex'>
          {projectDetails["azureProjectId"] != null &&
            <>
              <img src={azureDevOpsLogo} data-tip="Project is linked to an Azure DevOps project." className="h-wrap-content align-self-center" style={{ width: "36px" }}></img>
            </>
          }
          {projectDetails["name"]}
        </span>
      </h4>
      <p className="font-sm text-secondary mb-0">Project ID: {projectDetails["id"]}</p>
      <div className='mb-4'>
        <ProjectStatus status={projectStatus} />
      </div>

      <div id="projected-dates" className="row mb-4 gy-3">
        <div className="col-lg-3 col-sm-12 col-md-6">
          <span className="font-xsm">Projected Start Date</span><br />
          <span className="font-xsm bold">{dateFormat(projectDetails["dateProjectedStart"])}</span>
        </div>
        <div className="col-lg-3 col-sm-12 col-md-6">
          <span className="font-xsm">Projected End Date</span><br />
          <span className="font-xsm bold">{dateFormat(projectDetails["dateProjectedEnd"])}</span>
        </div>
        <div className="col-lg-3 col-sm-12 col-md-6">
          <span className="font-xsm">Actual Start Date</span><br />
          <span className="font-xsm bold">{dateFormat(projectDetails["dateActualStart"])}</span>
        </div>
        <div className="col-lg-3 col-sm-12 col-md-6">
          <span className="font-xsm">Actual End Date</span><br />
          <span className="font-xsm bold">{dateFormat(projectDetails["dateActualEnd"])}</span>
        </div>
      </div>

      <p className="font-sm mb-4">{projectDetails["description"]}</p>

      <hr />

      <div className='mb-4 col-lg-6 col-sm-12'>
        <label className='form-label font-sm'>Project Payment · <span className='bold' ref={totalPaymentRef}></span></label>

        <div className="progress" style={{ height: "10px" }}>
          <div className="progress-bar bg-success" role="progressbar" aria-label="Success example" style={{ width: `${paymentProgress * 100}%` }} aria-valuenow="25" aria-valuemin="0" aria-valuemax="100"></div>
        </div>

        <div className='d-flex justify-content-between'>
          <label className='form-label font-sm'>Paid · <span className='bold' ref={paidPaymentRef}></span></label>
          <label className='form-label font-sm'>Outstanding · <span className='bold' ref={outstandingPaymentRef}></span></label>
        </div>

      </div>

      <label className='form-label font-sm'>Latest Activity</label>

      <div className="card mb-4 bg-light">
        <div className="card-body">
          {projectDetails["azureProjectId"] != null &&
            <>
              {latestCommit == null &&
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              }

              {latestCommit != null &&
                <>
                  <p className="mb-0 font-sm bold">{latestCommit["comment"]}</p>
                  <div className="mb-1 font-xsm text-secondary">
                    <span className="text-dark">{latestCommit["author"]["name"] == "unknown" ? latestCommit["author"]["email"] : latestCommit["author"]["name"]}</span> commited {humanDate.relativeTime(latestCommit["author"]["date"])} to <a target={"_blank"} href={latestCommit["repository"]["remoteUrl"]}>
                      {latestCommit["repository"]["name"]}
                    </a>
                  </div>
                </>
              }
            </>
          }

          {projectDetails["azureProjectId"] == null &&
            <div className="font-xsm text-secondary">
              <span><i className='fa fa-circle-info me-2'></i>Link project to Azure DevOps to view latest commits and updates.</span>
            </div>
          }

        </div>

      </div>

      <div ><GenerateReport /></div>

      <div>
        <ChartFunction />
      </div>

      <div class="mt-4">
        <h6 class="mb-2">Project Analytics</h6>
        <select id="chart-filter" class="form-select form-select-sm mt-2" onChange={handler}>
          {/* <option value="" selected="selected" onClick={handleHide}>All Milestones</option>  */}
          {Object.entries(milestoneList).map(([retrieveid, obj]) => selected && retrieveid === selected.id
            ? <option onClick={ChartFunction(retrieveid.id.toLowerCase())} selected key={obj.id} value={obj.id}>{obj.name}</option>
            : <><option onClick key={obj.id} value={obj.id}>{obj.name}</option>

            </>
          )}

        </select>
      </div>
      {/* <ChartFunction /> */}
      <div className="chartFunction">

        <div class="row" id="charts">
          <p class="text-center">Work Distribution (Tasks Completed)</p>
          <div id="pie-chart-div" class="col-lg-6 col">
            <canvas id="pie-chart"></canvas>
          </div>
          <div id="bar-chart-div" class="col-lg-6 col">
            <canvas id="bar-chart"></canvas>
          </div>
        </div>
        <div id="no-data">
          <partial name="_NoDataPartial" model="NoReportDataDisplay" />
        </div>

      </div>





      {heatmap.length > 0 &&
        <>
          <label className='form-label font-sm'>
            <span>
              {heatmap.map(x => x["count"]).reduce((a, b) => a + b)} commits across all repositories in the last year
            </span>
          </label>

          <div className='border px-3 rounded pt-3 pe-5'>
            <ReactTooltip />
            <ReactCalendarHeatmap
              startDate={moment().subtract(1, "years")}
              endDate={moment()}
              showOutOfRangeDays={true}
              showWeekdayLabels={true}
              gutterSize={2}
              classForValue={value => {
                if (!value) {
                  return 'color-empty';
                }
                return `color-github-${value.count}`;
              }}
              values={heatmap}
              tooltipDataAttrs={value => {
                if (value["date"] != null) {
                  return {
                    'data-tip': `${value.count == null ? 0 : value.count} commits on ${dateFormat(value["date"])}`,
                  };
                }
              }}
            />
          </div>
        </>
      }
    </LayoutSidebar>


  )
}
