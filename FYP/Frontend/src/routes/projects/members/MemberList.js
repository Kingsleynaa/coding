import React, { useCallback, useEffect, useRef, useState } from 'react'
import axios from "axios"
import { LayoutSidebar } from '../../../layouts/LayoutSidebar'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useParams } from 'react-router-dom'
import { setBreadcrumbPath, setSidebarInformation } from '../../../redux/siteSlice'
import { SIDEBAR_TABS } from '../../../components/SidebarProject'
import { RowMember } from '../../../components/projects/RowMember'
import { dateFormat } from '../../../utils/CommonUtils'
import Tags from "@yaireo/tagify/dist/react.tagify"
import "@yaireo/tagify/dist/tagify.css"
import { tagTemplate, dropdownHeaderTemplate, suggestionItemTemplate } from '../../../components/Tagify/TagifyTemplate'

export const MemberList = () => {
  const dispatch = useDispatch()
  const { projectId } = useParams()
  const [projectRoles, setProjectRoles] = useState([{
    "id": "",
    "name": ""
  }])
  const [projectDetails, setProjectDetails] = useState({})

  const [projectMembers, setProjectMembers] = useState([])
  const tagifyRef = useRef()
  const [searchQuery, setSearchQuery] = useState("")

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

  useEffect(() => {
    const loadPageData = async () => {
      let projectDetailsResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)
      let projectDetails = projectDetailsResponse.data

      setProjectDetails(projectDetails)

      // Setting the breadcrumb path
      dispatch(setBreadcrumbPath({
        [projectDetails["name"]]: `/projects/${projectDetails["id"]}`,
        "Members": ``,
      }))

      dispatch(setSidebarInformation({
        "name": projectDetails["name"],
        "dateProjectedStart": projectDetails["dateProjectedStart"],
        "dateProjectedEnd": projectDetails["dateProjectedEnd"],
        "active": SIDEBAR_TABS.MEMBERS
      }))

      let projectRolesResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/roles`)
      setProjectRoles(projectRolesResponse.data)
    }

    loadPageData()
    loadMembers()
    console.log(tagifyRef.current)
  }, [])

  const loadMembers = async () => {
    let nonProjectMembersResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/members/search`, {
      "isProjectMember": false
    })

    console.log(nonProjectMembersResponse.data)

    // Programitically change the whitelist for tagify
    tagifyRef.current.settings.whitelist = nonProjectMembersResponse.data
  }

  const addMembersToProject = async () => {
    let userIdList = tagifyRef.current.value.map(x => x.value)
    let roleId = document.getElementById("selected-role").value

    let addMembersToProjectResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/members`,
      {
        userIdList: userIdList,
        projectRoleId: roleId
      }
    )

    if (addMembersToProjectResponse.status == 200) {
      // Clearing the input field and reloading the members on successful add
      tagifyRef.current.removeAllTags()
      loadMembers()
      searchByMemberName()
    }
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

    tagifyRef.current.settings.whitelist = searchResultsResponse.data

  }, [])

  const searchByMemberName = async () => {
    let searchResultsResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/members/search`, {
      "isProjectMember": true,
      "query": searchQuery
    })

    setProjectMembers(searchResultsResponse.data)
  }

  useEffect(() => {
    searchByMemberName()
  }, [searchQuery])

  const removeMember = async (userId) => {
    let removeMemberResponse = await axios.delete(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/members/${userId}`)

    if (removeMemberResponse.status == 200) {
      tagifyRef.current.removeAllTags()
      loadMembers()
      searchByMemberName()
    }
  }

  const updateProjectMemberRole = async (memberId, roleId) => {
    let data = {
      "projectId": projectId,
      "memberId": memberId,
      "roleId": roleId
    }

    let updateProjectMemberRoleResponse = await axios.patch(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}/members/update-role`, data)
    if (updateProjectMemberRoleResponse.status == 200) {
      searchByMemberName()
    }
  }

  return (
    <LayoutSidebar>
      <div className="d-flex justify-content-between border-bottom flex-wrap">
        <div className="d-flex order-2 order-lg-1 flex-grow-1">
          <a className="nav-link font-sm milestones-scope bold text-dark active" href="/Projects/Milestones">Members</a>
        </div>

        <div className="d-flex order-1 order-lg-2 col-12 col-lg-2 justify-content-end">
          {!projectDetails["isCompleted"] &&
            <button data-bs-toggle="modal" data-bs-target="#exampleModal" className="btn btn-primary no-decoration-on-hover my-1 font-sm pt-2 flex-grow-1 flex-lg-grow-0 h-wrap-content align-self-center" style={{ whiteSpace: "nowrap" }}>
              Invite members
            </button>
          }
        </div>
      </div>

      <div className='d-flex py-2 border-bottom mb-3'>
        <input className="flex-grow-1 flex-lg-grow-0 w-auto form-control font-sm my-1 flex-grow-1 me-lg-2 h-wrap-content align-self-center" onChange={e => setSearchQuery(e.target.value)} value={searchQuery} placeholder="Search" />
      </div>

      {projectMembers.map(member => {
        return (
          <div className='milestone'>
            <div className="row mb-4 justify-content-between">
              <div className="col-12 col-lg-5">
                <Link to={""} className="my-0 bold font-sm text-dark">{member["name"]}</Link>
                <p className="my-0 font-sm text-secondary">{member["email"]}</p>
              </div>

              <div className="col-12 col-lg-2">
                <div class="dropdown">
                  <span className={`badge rounded-pill bg-light text-dark ${member["role"] != "Creator" ? "cursor-pointer" : ""}`} data-bs-toggle={`${member["role"] != "Creator" ? "dropdown" : ""}`} style={{ fontWeight: 500 }}>{member["role"]}</span>

                  <ul class="dropdown-menu font-sm" aria-labelledby="dropdownMenuButton1">
                    {member["role"] != "Creator" &&
                      projectRoles.map(role => {
                        return (<li><span class="dropdown-item cursor-pointer" onClick={e => updateProjectMemberRole(member["userId"], role["id"])}>{role["name"]}</span></li>)
                      })
                    }
                  </ul>

                </div>
              </div>

              <div className="col-12 col-lg-2 mb-2 mb-lg-0">
                <span className='font-sm text-secondary'>Joined on {dateFormat(member["dateJoined"])}</span>
              </div>

              <div className='col-12 col-lg-2 text-lg-end text-sm-start'>
                {member["role"] != "Creator" && !projectDetails["isCompleted"] &&
                  <button className='btn btn-outline-danger font-xsm' data-bs-toggle="modal" data-bs-target={`#delete${member["value"]}`} >Remove</button>
                }
              </div>
            </div>

            <div className="modal fade" id={`delete${member["value"]}`} tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h6 className="modal-title" id="exampleModalLabel">Are you sure?</h6>
                    <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                  </div>
                  <div className="modal-body font-sm">
                    You're about to remove <span className='bold'>{member["name"]}</span> from the project.
                    <br />
                    <br />
                    If you change your mind later on, you still can reinvite <span className='bold'>{member["name"]}</span> into the project, but all their associations with project tasks would be removed.
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Close</button>
                    <button type="button" onClick={e => removeMember(member["value"])} className="btn btn-danger font-sm" data-bs-dismiss="modal">Remove member</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}


      {/* Modal to invite members */}

      <div className="modal fade" id="exampleModal" tabIndex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h6 className="modal-title" id="exampleModalLabel">Invite members</h6>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <label className='form-label font-sm'>Name or email address</label>

              <Tags
                className='form-control font-xsm'
                tagifyRef={tagifyRef} // optional Ref object for the Tagify instance itself, to get access to  inner-methods
                onDropdownSelect={onTagifyChange}
                onInput={onTagifyInput}
                settings={tagifySettings}
              />

              <label className='form-label font-sm mt-3'>Select a role</label>
              <select className='form-select font-sm' id="selected-role">
                <option selected value={projectRoles[0].id}>{projectRoles[0].name}</option>

                {projectRoles.slice(1).map(role => {
                  return (<option value={role.id}>{role.name}</option>)
                })}

              </select>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-outline-dark font-sm" data-bs-dismiss="modal">Close</button>
              <button type="button" onClick={addMembersToProject} className="btn btn-primary font-sm" data-bs-dismiss="modal">Invite</button>
            </div>
          </div>
        </div>
      </div>

    </LayoutSidebar>
  )
}
