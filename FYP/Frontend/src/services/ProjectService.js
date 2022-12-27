import axios from "axios";

const createProject = async (projectDetails) => {
  try {
    let response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/projects`, projectDetails, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.status === 200) {
      return true
    }

    return false

  } catch (error) {
    console.error(error)
    return false
  }
}

const getAllProjects = async () => {
  try {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/projects`)

    if (response.status === 200) {
      return response.data
    }

    return []

  } catch (error) {
    console.error(error)
    return []
  }
}

const updateProject = async (updatedProjectDetails) => {
  try {
    let response = await axios.put(`${process.env.REACT_APP_API_SERVER}/api/projects`, updatedProjectDetails, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.status === 200) {
      return true
    }

    return false


  } catch (error) {
    console.error(error)
    return false
  }
}

const deleteProject = async (projectId) => {
  try {
    let response = await axios.delete(`${process.env.REACT_APP_API_SERVER}/api/projects/${projectId}`)

    if (response.status === 200) {
      return true
    }

    return false

  } catch (error) {
    console.error(error)
    return false
  }
}

const createMilestone = async (milestoneDetails) => {
  console.log(milestoneDetails)

  try {
    let response = await axios.post(`${process.env.REACT_APP_API_SERVER}/api/milestones`, milestoneDetails, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.status === 200) {
      return true
    }

    return false

  } catch (error) {
    return false
  }
}

const getAllMilestones = async (projectId) => {
  console.log(`Retrieving milestones for project with Id: ${projectId}`)

  try {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones?projectId=${projectId}`, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.status === 200) {
      return response.data
    }

    return []

  } catch (error) {
    console.error(error)
    return []
  }
}

const getMilestoneById = async (milestoneId) => {
  console.log("Retrieving milestone with Id: " + milestoneId)
  try {
    let response = await axios.get(`${process.env.REACT_APP_API_SERVER}/api/milestones/${milestoneId}`, {
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (response.status === 200) {
      return response.data
    }

    return null

  } catch (error) {
    console.error(error)
    return null
  }
}

export { createProject, getAllProjects, createMilestone, getAllMilestones, getMilestoneById, updateProject, deleteProject }