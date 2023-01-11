import React, { useEffect } from 'react'
import { useSelector } from 'react-redux/es/exports'
import { Link, useParams } from 'react-router-dom'
import { dateFormat } from '../utils/CommonUtils'

const SIDEBAR_TABS = {
  "INFORMATION": "INFORMATION",
  "MILESTONES": "MILESTONES",
  "REQUIREMENTS": "REQUIREMENTS",
  "DOCUMENTS": "DOCUMENTS",
  "RISKS": "RISKS",
  "MEMBERS": "MEMBERS",
  "SETTINGS": "SETTINGS"
}

Object.freeze(SIDEBAR_TABS)


const SidebarProject = () => {
  const checkSidebarActiveTab = (tabName) => {
    if (sidebar["payload"] != null && sidebar["payload"]["active"] == tabName) {
      return "active bold"
    }
    return ""
  }
  const sidebar = useSelector(state => state["counter"]["sidebarInformation"])
  const { projectId } = useParams()

  useEffect(() => {
    console.log(sidebar)
  }, [sidebar])


  return (
    <div className="d-flex">
      <div className="nav flex-column nav-pills mx-3 w-100 mt-3" id="v-pills-tab" role="tablist" aria-orientation="vertical">
        {sidebar["payload"] != undefined &&
          <div className='ps-3 pt-2'>
            <h5 className='mb-1 bold anywhere-wrap'>{sidebar["payload"]["name"]}</h5>
            <span className='font-xsm bold text-secondary'>{dateFormat(sidebar["payload"]["dateProjectedStart"])} - {dateFormat(sidebar["payload"]["dateProjectedEnd"])}</span>
          </div>
        }

        <hr className='mb-2' />
        <Link to={`/projects/${projectId}`} className={`nav-link text-start font-sm no-decoration-on-hover ${checkSidebarActiveTab(SIDEBAR_TABS.INFORMATION)}`}><i className='fa fa-circle-info me-2'></i>Information</Link>
        <Link to={`/projects/${projectId}/requirements`} className={`nav-link text-start font-sm no-decoration-on-hover ${checkSidebarActiveTab(SIDEBAR_TABS.REQUIREMENTS)}`}><i className='fa fa-clipboard-check me-2'></i>Requirements</Link>
        <Link to={`/projects/${projectId}/milestones`} className={`nav-link text-start font-sm no-decoration-on-hover ${checkSidebarActiveTab(SIDEBAR_TABS.MILESTONES)}`}><i className='fa fa-flag me-2'></i>Milestones</Link>
        <Link to={`/projects/${projectId}/documents`} className={`nav-link text-start font-sm no-decoration-on-hover ${checkSidebarActiveTab(SIDEBAR_TABS.DOCUMENTS)}`}><i className='fa fa-file-alt me-2'></i>Documents</Link>
        <Link to={`/projects/${projectId}/risks`} className={`nav-link text-start font-sm no-decoration-on-hover ${checkSidebarActiveTab(SIDEBAR_TABS.RISKS)}`}><i className='fa fa-exclamation-triangle me-2'></i>Risks</Link>
        <Link to={`/projects/${projectId}/members`} className={`nav-link text-start font-sm no-decoration-on-hover ${checkSidebarActiveTab(SIDEBAR_TABS.MEMBERS)}`}><i className='fa fa-user me-2'></i> Members</Link>
        <Link to={`/projects/${projectId}/settings`} className={`nav-link text-start font-sm no-decoration-on-hover ${checkSidebarActiveTab(SIDEBAR_TABS.SETTINGS)}`}><i className='fa fa-cog me-2'></i>Settings</Link>
      </div>
    </div>
  )
}

export { SidebarProject, SIDEBAR_TABS }
