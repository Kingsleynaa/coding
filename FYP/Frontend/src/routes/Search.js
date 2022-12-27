import React, { useEffect, useRef, useState, useCallback } from 'react'
import { LayoutNoSidebar } from '../layouts/LayoutNoSidebar'
import { tagTemplate, dropdownHeaderTemplate, suggestionItemTemplate } from '../components/Tagify/TagifyTemplate'
import Tags from "@yaireo/tagify/dist/react.tagify"
import "@yaireo/tagify/dist/tagify.css"
import axios from 'axios'
import { RowProject } from '../components/projects/RowProject'
import moment from 'moment'
import { Link } from 'react-router-dom'
import $ from "jquery"
import { getUserInformation } from '../services/UserService'

const PROJECT_SCOPE = {
  "All": "ALL",
  "Created by you": "CREATED_BY_YOU",
}

const PROJECT_STATUS = {
  "ALL": "All",
  "ONGOING": "Ongoing",
  "OVERDUE_COMPLETION": "Overdue Completion",
  "AWAITING_PAYMENT": "Awaiting Payment",
  "PAID": "Paid",
  "OVERDUE_PAYMENT": "Overdue Payment"
}

const showSidebar = () => {
  $(".sidebar-mobile").removeClass("d-none")
  $(".sidebar-mobile").removeClass("slide-left")
  $(".sidebar-mobile").addClass("slide-right")
  $(".mobile-backdrop").removeClass("d-none")
  $(".mobile-backdrop").addClass("fade-in")
}

const hideSidebar = () => {
  $(".mobile-backdrop").removeClass("fade-in");
  $(".mobile-backdrop").addClass("d-none");
  $(".sidebar-mobile").addClass("slide-left");
  $(".sidebar-mobile").removeClass("slide-right");
}


const PROJECT_SORT = {
  "Date Updated (Newest First)": "DATE_UPDATED_DESC",
  "Date Updated (Oldest First)": "DATE_UPDATED_ASC",
  "Date Created (Newest First)": "DATE_CREATED_DESC",
  "Date Created (Oldest First)": "DATE_CREATED_ASC",
  "Projected Start Date (Newest First)": "DATE_PROJECTED_START_ASC",
  "Projected Start Date (Oldest First)": "DATE_PROJECTED_START_DESC",
  "Projected End Date (Newest First)": "DATE_PROJECTED_END_ASC",
  "Projected End Date (Oldest First)": "DATE_PROJECTED_END_DESC",
}

export const Search = () => {

  useEffect(() => {
    var onDesktop = window.matchMedia("(min-width: 992px)")

    const changeMarginForMain = () => {
      if (onDesktop.matches) {
        $(".main").css("margin-left", $(".sidebar-desktop").innerWidth())
        $(".content").css("margin-top", $("#navbar-desktop").innerHeight())
        $(".notifications").css("left", "")
        $(".notifications").css("right", "")
        $(".notifications").css("top", "")
      } else {
        $(".main").css("margin-left", 0)
        $(".content").css("margin-top", $("#navbar-mobile").innerHeight())
        $(".notifications").css("left", "-100px")
        $(".notifications").css("right", "auto")
        $(".notifications").css("top", "50px")
      }
    }


    changeMarginForMain()

    $(".notifications").css("left", "-100px")
    $(".notifications").css("right", "auto")

    // Checking for screen size and deciding whether to hide or show sidebar
    window.addEventListener('resize', changeMarginForMain);
    onDesktop.addListener(changeMarginForMain);
  })

  useEffect(() => {
    document.title = "Projects"
  }, [])

  const [userQuery, setUserQuery] = useState("")
  const [genericQuery, setGenericQuery] = useState("")
  const [userRoleId, setUserRoleId] = useState("")
  const [searchResults, setSearchResults] = useState([])
  const [projectRoles, setProjectRoles] = useState([])
  const [projectScope, setProjectScope] = useState(PROJECT_SCOPE["All"])
  const [isFiltersApplied, setIsFiltersApplied] = useState(true)
  const [selectedSort, setSelectedSort] = useState(PROJECT_SORT["Date Updated (Newest First)"])
  const [projectStatus, setProjectStatus] = useState("ALL")

  const [currentUser, setCurrentUser] = useState({})

  let dateProjectedStartRef = useRef()
  let dateProjectedEndRef = useRef()
  let searchInputRef = useRef()

  const tagifyRef = useRef()

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
    loadRoles()
    searchProjects()
  }, [])

  // Function only loads at max 10 users at once
  const loadUsers = async () => {
    let payload = {
      query: userQuery,
      userIdList: tagifyRef.current.value.map(x => x.value),
      resultSize: 10,
      resultPage: 0
    }

    console.log(payload)

    let usersResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/users/search`, payload)
    tagifyRef.current.settings.whitelist = usersResponse.data
  }

  const loadRoles = async () => {
    let projectRolesResponse = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects/roles`)
    setProjectRoles(projectRolesResponse.data)
  }

  const searchProjects = async () => {
    console.log(dateProjectedStartRef.current.value)
    console.log(dateProjectedEndRef.current.value)

    let payload = {
      userIdList: [],
      genericQuery: searchInputRef.current.value,
      userRoleId: "",
      projectScope: projectScope,
      sort: selectedSort
    }

    if (isFiltersApplied) {
      payload["userIdList"] = tagifyRef.current.value.map(x => x.value)
      payload["userRoleId"] = userRoleId
      payload["projectStatus"] = projectStatus
      payload["dateProjectStart"] = dateProjectedStartRef.current.value
      payload["dateProjectEnd"] = dateProjectedEndRef.current.value
    } else {
      payload["projectStatus"] = "ALL"
    }

    if (moment(dateProjectedStartRef.current.value).isValid() && isFiltersApplied) {
      payload["dateProjectedStart"] = dateProjectedStartRef.current.value
    }

    if (moment(dateProjectedEndRef.current.value).isValid() && isFiltersApplied) {
      payload["dateProjectedEnd"] = dateProjectedEndRef.current.value
    }

    console.log(payload)

    let searchResponse = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects/search/advanced`, payload)
    console.log(searchResponse)
    setSearchResults(searchResponse.data)
    setGenericQuery(searchInputRef.current.value)
  }

  useEffect(() => {
    loadUsers()
  }, [userQuery])

  const onTagifyInput = useCallback(async (e) => {
    setUserQuery(e.detail.value)
  }, [])

  const onTagifyChange = useCallback((e) => {
    console.log(e.detail.elm.className, e.detail.elm.classList.contains(`${tagifyRef.current.settings.classNames.dropdownItem}__addAll`))

    if (e.detail.elm.classList.contains(`${tagifyRef.current.settings.classNames.dropdownItem}__addAll`)) {
      tagifyRef.current.dropdown.selectAll()
    }
  }, [])

  const handleSearchKeyUp = (e) => {
    if (e.keyCode == 13) {
      searchProjects()
    }
  }

  useEffect(() => {
    searchProjects()
  }, [projectScope])

  useEffect(() => {
    searchProjects()
  }, [selectedSort])

  useEffect(() => {
    if (isFiltersApplied) {
      $(".filter").css("filter", "brightness(100%)")
      $("#filters-desktop").css("background-color", "white")
      $("#filters").css("background-color", "white")
    } else {
      $(".filter").css("filter", "brightness(85%)")
      $("#filters").css("background-color", "rgba(0,0,0,0.1)")
      $("#filters-desktop").css("background-color", "rgba(0,0,0,0.1)")
    }

    searchProjects()
  }, [isFiltersApplied])

  useEffect(() => {
    const loadPageData = async () => {
      setCurrentUser(await getUserInformation())
    }

    loadPageData()
  }, [])

  return (
    <LayoutNoSidebar>
      <div className="d-none d-lg-none mobile-backdrop" onClick={hideSidebar}></div>
      <div className="row">
        {/* Filters on desktop */}
        <div className="col-lg-2 border-end pt-3 d-none d-lg-block fixed-sidebar sidebar-desktop" style={{ minHeight: "100vh" }} id="filters-desktop">

          <div className='d-flex mb-3 justify-content-between'>
            <label className="bold align-self-center me-3">Filters</label>

            <div class="form-check form-switch align-self-center mb-0">
              <input class="form-check-input"
                type="checkbox"
                onChange={e => setIsFiltersApplied(prevState => !prevState)}
                checked={isFiltersApplied}
                id="flexSwitchCheckDefault" />
            </div>
          </div>

          <div>
            <div className="filter">
              <div className='d-flex justify-content-between mb-2'>
                <label className="font-sm align-self-center">User</label>
              </div>

              <Tags
                className='form-control font-xsm'
                tagifyRef={tagifyRef} // optional Ref object for the Tagify instance itself, to get access to  inner-methods
                settings={tagifySettings}
                onDropdownSelect={onTagifyChange}
                onInput={onTagifyInput}
              />
            </div>

            <div className="filter">
              <label className="mb-2 font-sm">Role</label>
              <select className="form-select font-sm" aria-label="Default select example" value={userRoleId} onChange={e => setUserRoleId(e.target.value)} >
                <option value={""}>Any</option>

                {projectRoles.map(role => {
                  return (<option value={role["id"]}>{role["name"]}</option>)
                })}
              </select>
            </div>
          </div>

          <div className="filter">
            <label className="mb-2 font-sm">Projected Start Date</label>
            <input type="date" className="form-control font-sm" ref={dateProjectedStartRef} />
          </div>

          <div className="filter">
            <label className="mb-2 font-sm">Projected End Date</label>
            <input type="date" className="form-control font-sm" ref={dateProjectedEndRef} />
          </div>

          <div className="filter">
            <label className="form-label font-sm">Project Status</label>

            <select class="form-select font-sm" aria-label="Default select example" onChange={e => setProjectStatus(e.target.value)} value={projectStatus}>
              {Object.keys(PROJECT_STATUS).map(key => {
                return (
                  <option value={key}>{PROJECT_STATUS[key]}</option>
                )
              })}
            </select>
          </div>


        </div>

        {/* Filters on mobile */}
        <div className="col-lg-2 border-end pt-3 d-lg-none d-none fixed-sidebar sidebar-mobile bg-white" style={{ minHeight: "100vh" }} id="filters">

          <div className='d-flex mb-3 justify-content-between'>
            <label className="bold align-self-center me-3">Filters</label>

            <div class="form-check form-switch align-self-center mb-0">
              <input class="form-check-input"
                type="checkbox"
                onChange={e => setIsFiltersApplied(prevState => !prevState)}
                checked={isFiltersApplied}
                id="flexSwitchCheckDefault" />
            </div>
          </div>

          <div>
            <div className="filter">
              <div className='d-flex justify-content-between mb-2'>
                <label className="font-sm align-self-center">User</label>
              </div>

            </div>

            <div className="filter">
              <label className="mb-2 font-sm">Role</label>
              <select className="form-select font-sm" aria-label="Default select example" value={userRoleId} onChange={e => setUserRoleId(e.target.value)} >
                <option value={""}>Any</option>

                {projectRoles.map(role => {
                  return (<option value={role["id"]}>{role["name"]}</option>)
                })}
              </select>
            </div>
          </div>

          <div className="filter">
            <label className="mb-2 font-sm">Projected Start Date</label>
            <input type="date" className="form-control font-sm" ref={dateProjectedStartRef} />
          </div>

          <div className="filter">
            <label className="mb-2 font-sm">Projected End Date</label>
            <input type="date" className="form-control font-sm" ref={dateProjectedEndRef} />
          </div>

          <div className="filter">
            <label className="form-label font-sm">Project Status</label>

          </div>

          <button className="font-xsm btn btn-outline-dark d-lg-none align-self-center me-3 w-100" onClick={hideSidebar}>
            Close
          </button>

        </div>

        <div id="search-bar" className="col-lg-10 h-wrap-content pt-3 main">

          <div className="d-flex justify-content-between pb-3 mb-2 pt-1 border-bottom align-content-center">
            <h5 className="mb-0 align-self-center bold">Projects</h5>
            <Link to={"/projects/new"} className="btn btn-primary font-sm no-decoration-on-hover align-self-center">New Project</Link>
          </div>

          <div>
            <div className='d-flex'>
              <input className="form-control font-sm" placeholder="Search project name, description and lead" ref={searchInputRef} onKeyUp={e => handleSearchKeyUp(e)} />
              <button className='btn btn-primary font-sm ms-2' onClick={searchProjects}>Search</button>
            </div>
          </div>

          <div id="search-results">
            <div className="row border-bottom justify-content-between">
              <div className='d-flex col-2 col-lg-9 col-sm-12'>
                {currentUser["roleId"] != "00000000-0000-0000-0000-000000000002" &&
                  Object.keys(PROJECT_SCOPE).map(value => {
                    return (
                      <span onClick={e => setProjectScope(PROJECT_SCOPE[value])} className={`nav-link font-sm milestones-scope text-dark ${projectScope == PROJECT_SCOPE[value] ? "active bold" : ""}`} style={{ whiteSpace: "nowrap", cursor: "pointer" }}>{value}</span>
                    )
                  })
                }

                {currentUser["roleId"] == "00000000-0000-0000-0000-000000000002" &&
                  <span className={`nav-link font-sm milestones-scope text-dark active bold`} style={{ whiteSpace: "nowrap", cursor: "pointer" }}>Led by you</span>
                }
              </div>

              <div className="align-self-center my-2 col-lg-3 col-sm-12 justify-content-end d-flex">
                <select className="form-select font-sm" aria-label="Default select example" value={selectedSort} onChange={e => setSelectedSort(e.target.value)}>
                  {Object.keys(PROJECT_SORT).map(value => {
                    return (
                      <option value={PROJECT_SORT[value]}>{value}</option>
                    )
                  })}
                </select>
              </div>
            </div>


            <button className="font-sm btn btn-outline-dark d-lg-none align-self-center w-100 mt-2" onClick={showSidebar}>
              Filters
            </button>

            <p className="font-sm text-secondary mb-0 py-3 bg-light px-3 border-bottom">Showing {searchResults.length} result(s) for <span className="text-danger">"{genericQuery}"</span></p>

            <div className="border-bottom py-3 flex-wrap d-none d-lg-block mb-2">
              <div className='row'>
                <div class="col-lg-3 font-sm bold">Project</div>
                <div class="col-lg-2 font-sm bold">Project Lead</div>
                <div class="col-lg-2 font-sm bold">Milestone Progress</div>
                <div class="col-lg-3 font-sm bold text-center">Date Updated</div>
                <div class="col-lg-2 font-sm bold"></div>
              </div>
            </div>

            <div className='mb-2'></div>

            {searchResults.length > 0 &&
              searchResults.map((project, index) =>
                <RowProject
                  key={project["id"]}
                  index={index}
                  project={project}
                />
              )}
          </div>
        </div>

      </div>
    </LayoutNoSidebar >
  )
}
