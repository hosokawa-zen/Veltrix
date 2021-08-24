import React, { Component } from "react";
import {Row, Col, Button} from "reactstrap";
import { Link } from "react-router-dom";
import Project from "./components/project";
import Plan from "./components/plan";
import {getBackendAPI} from "../../helpers/backend";

class MakeReadyPlanPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      newProject: null,
      projects: [],
      selectProjectId: null,
      newPlan: null,
      plans: []
    };
  }

  componentDidMount() {
    this.init();
  }

  init = async () => {
    const projects = await getBackendAPI().getProjects();
    this.setState({projects});
  }

  addNewProject = () => {
    const newProject = {_id: null, name: '', description: '', created_by: '', is_locked: false};
    this.setState({newProject: newProject})
  }

  onDuplicateProject = (_id) => {
    const project = this.state.projects.find(p => p._id === _id);
    if(project){
      const newProject = {...project, _id: null};
      this.setState({newProject});
    }
  }

  onDeleteProject = (_id) => {
    const projects = this.state.projects.filter(p => p._id !== _id);
    if(this.state.selectProjectId === _id){
      this.setState({projects, selectProjectId: null});
    } else {
      this.setState({projects});
    }
  }

  onSaveProject = (project) => {
    const old = this.state.projects.find(p => p._id === project._id);
    if(old){
      const newProjects = this.state.projects.map(p => p._id === project._id?project:p);
      this.setState({projects: newProjects});
    } else {
      this.setState({projects: [...this.state.projects, project]});
    }
  }

  addNewPlan = () => {
    const newPlan = {_id: null, name: '', description: '', created_by: '', teams: '', packages: '', locations: '', is_locked: false};
    this.setState({newPlan})
  }

  onDuplicatePlan = (_id) => {
    const plan = this.state.plans.find(p => p._id === _id);
    if(plan){
      const newPlan = {...plan, _id: null};
      this.setState({newPlan});
    }
  }

  onDeletePlan = (_id) => {
    const plans = this.state.plans.filter(p => p._id !== _id);
    this.setState({plans});
  }

  onSavePlan = (plan) => {
    const old = this.state.plans.find(p => p._id === plan._id);
    if(old){
      const newPlans = this.state.plans.map(p => p._id === plan._id?plan:p);
      this.setState({plans: newPlans});
    } else {
      this.setState({plans: [...this.state.plans, plan]});
    }
  }

  onSelect = (project) => {
    this.setState({selectProjectId: project._id, plans: project.plans??[]});
  }

  render() {
    const {projects, plans, newProject, newPlan, selectProjectId} = this.state;

    return (
      <React.Fragment>
        <div className="container-fluid page-projects">
          <Row className="align-items-center">
            <Col sm={6}>
              <div className="page-title-box">
                <h4 className="font-size-18">Visual Planner</h4>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/#">Production Control</Link>
                  </li>
                  <li className="breadcrumb-item active">Visual Planner</li>
                </ol>
              </div>
            </Col>
          </Row>

          <div className="page-content">
            <Row className="section-projects">
              <Col sm={12}>
                <div className="section-title">Sub Project</div>
                <Button
                    color="primary"
                    className="btn btn-primary waves-effect waves-light"
                    onClick={this.addNewProject}
                >
                  Add a new Sub Project
                </Button>
                <div className="projects-container">
                  {
                    newProject?
                        <Project
                            key={'new'}
                            project={newProject}
                            onDelete={() => this.setState({newProject: null})}
                            onSave={(p) => {
                              this.setState({newProject: null});
                              this.onSaveProject(p);
                            }}
                        />
                      : null
                  }
                  {
                    projects.map(p =>
                        <Project
                          key={p._id}
                          project={p}
                          isSelected={p._id === selectProjectId}
                          onSelect={() => this.onSelect(p)}
                          onDelete={() => this.onDeleteProject(p._id)}
                          onDuplicate={() => this.onDuplicateProject(p._id)}
                          onSave={(p) => this.onSaveProject(p)}
                        />)
                  }
                </div>
              </Col>
            </Row>
            {
              selectProjectId?
                <Row className="section-phase">
                  <Col sm={12}>
                    <Button
                        color="primary"
                        className="btn btn-primary waves-effect waves-light"
                        onClick={this.addNewPlan}
                    >
                      Add a new Phase Plan
                    </Button>
                    <div className="plans-container">
                      {
                        newPlan?
                            <Plan
                                key={'new'}
                                projectId={selectProjectId}
                                plan={newPlan}
                                onDelete={() => this.setState({newPlan: null})}
                                onSave={(p) => {
                                  this.setState({newPlan: null});
                                  this.onSavePlan(p);
                                }}
                            />
                            : null
                      }
                      {
                        plans.map(p =>
                            <Plan
                              key={p._id}
                              projectId={selectProjectId}
                              plan={p}
                              onDelete={() => this.onDeletePlan(p._id)}
                              onDuplicate={() => this.onDuplicatePlan(p._id)}
                              onSave={(p) => this.onSavePlan(p)}
                        />)
                      }
                    </div>
                  </Col>
                </Row>
                  :null
            }
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default MakeReadyPlanPage;
