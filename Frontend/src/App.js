import logo from './logo.svg';
import './App.css';
import axios from 'axios';
import { BrowserRouter, Route } from 'react-router-dom';
import { Link } from 'react-router-dom';
import Login from './routes/user/Login';
import { Routes } from 'react-router-dom';
import { ProjectList } from './routes/Index';
import { ProjectDetails } from './routes/projects/ProjectDetails';
import $ from "jquery";
import { MilestoneList } from './routes/projects/miletones/MilestoneList';
import { MilestoneDetails } from './routes/projects/miletones/MilestoneDetails';
import { TaskCreate } from './routes/projects/miletones/tasks/TaskCreate';
import { MilestoneCreate } from './routes/projects/miletones/MilestoneCreate';
import { Search } from './routes/Search';
import { ProjectCreate } from './routes/projects/ProjectCreate';
import { AuthenticatedRoute } from './components/AuthenticatedRoute';
import { AnonymousRoute } from './components/AnonymousRoute';
import { MemberList } from './routes/projects/members/MemberList';
import { ProjectSettings } from './routes/projects/ProjectSettings';
import { MilestoneEdit } from './routes/projects/miletones/MilestoneEdit';
import { TaskDetails } from './routes/projects/miletones/tasks/TaskDetails';
import { TaskEdit } from './routes/projects/miletones/tasks/TaskEdit';
import { RiskList } from './routes/projects/risks/RiskList';
import { RiskCreate } from './routes/projects/risks/RiskCreate';
import { RiskEdit } from './routes/projects/risks/RiskEdit';
import { DocumentList } from './routes/projects/documents/DocumentList';
import { RequirementList } from './routes/projects/requirements/RequirementList';
import { Test } from './routes/Test';
import { NotificationList } from './routes/notifications/NotificationList';
import { EmailTemplateCreate } from './routes/notifications/emails/templates/EmailTemplateCreate';
import { SendEmail } from './routes/notifications/emails/SendEmail';


//import { Report } from './routes/projects/miletones/report';



axios.interceptors.request.use(
  config => {
    config.headers.authorization = `Bearer ${localStorage.getItem("token")}`
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// TODO: Wrap AuthenticatedRoute for routes that need it 
function App() {
  const projectId = "@Model.Project.ProjectId";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <AuthenticatedRoute>
            <Search />
          </AuthenticatedRoute>
        } />


        {/* Only allow user to access page if they are not already logged in */}
        <Route path="/user/login" element={
          <AnonymousRoute>
            <Login />
          </AnonymousRoute>
        } />

        <Route path="/projects/:projectId" element={<AuthenticatedRoute><ProjectDetails /></AuthenticatedRoute>} />
        <Route path="/projects/new" element={<AuthenticatedRoute><ProjectCreate /></AuthenticatedRoute>} />
        <Route path="/projects/:projectId/settings" element={<AuthenticatedRoute><ProjectSettings /></AuthenticatedRoute>} />

        <Route path="/projects/:projectId/requirements" element={<AuthenticatedRoute><RequirementList /></AuthenticatedRoute>} />

        <Route path="/projects/:projectId/members" element={<AuthenticatedRoute><MemberList /></AuthenticatedRoute>} />

        
  

        <Route path="/projects/:projectId/milestones" element={<AuthenticatedRoute><MilestoneList /></AuthenticatedRoute>} />
        <Route path="/projects/:projectId/milestones/new" element={<AuthenticatedRoute><MilestoneCreate /></AuthenticatedRoute>} />
        <Route path="/projects/:projectId/milestones/:milestoneId" element={<AuthenticatedRoute><MilestoneDetails /></AuthenticatedRoute>} />
        <Route path="/projects/:projectId/milestones/:milestoneId/edit" element={<AuthenticatedRoute><MilestoneEdit /></AuthenticatedRoute>} />

        <Route path="/projects/:projectId/milestones/:milestoneId/tasks/new" element={<AuthenticatedRoute><TaskCreate /></AuthenticatedRoute>} />
        <Route path="/projects/:projectId/milestones/:milestoneId/:taskId" element={<AuthenticatedRoute><TaskDetails /></AuthenticatedRoute>} />
        <Route path="/projects/:projectId/milestones/:milestoneId/:taskId/edit" element={<AuthenticatedRoute><TaskEdit /></AuthenticatedRoute>} />

        <Route path="/projects/:projectId/risks" element={<AuthenticatedRoute><RiskList /></AuthenticatedRoute>} />
        <Route path="/projects/:projectId/risks/new" element={<AuthenticatedRoute><RiskCreate /></AuthenticatedRoute>} />
        <Route path="/projects/:projectId/risks/:riskId/edit" element={<AuthenticatedRoute><RiskEdit /></AuthenticatedRoute>} />

        <Route path="/projects/:projectId/documents" element={<AuthenticatedRoute><DocumentList /></AuthenticatedRoute>} />

        <Route path="/notifications" element={<AuthenticatedRoute><NotificationList /></AuthenticatedRoute>} />
        <Route path="/notifications/emails/templates/new" element={<AuthenticatedRoute><EmailTemplateCreate /></AuthenticatedRoute>} />
        <Route path="/notifications/:notificationId/email" element={<AuthenticatedRoute><SendEmail /></AuthenticatedRoute>} />

        <Route path="/test" element={<AuthenticatedRoute><Test /></AuthenticatedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
