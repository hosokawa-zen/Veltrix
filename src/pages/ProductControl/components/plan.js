import React from "react";
import {getBackendAPI} from "../../../helpers/backend";


class Plan extends React.Component {
    constructor(props) {
        super(props);
        const plan = this.props.plan;
        const projectId = this.props.projectId;

        this.state = {
            isEditing: !(plan._id),
            project_id: projectId,
            name: plan.name??'',
            description: plan.description??'',
            created_by: plan.created_by??'',
            teams: plan.teams??'',
            packages: plan.packages??'',
            locations: plan.locations??'',
            isLocked: plan.is_locked??false,
        };
    }

    onSave = async () => {
        const {name, description, created_by, teams, packages, locations, project_id} = this.state;

        if(!name.trim().length || !project_id){
            return;
        }

        try{
            let plan = null;
            if(!this.props.plan._id){
                const newPlan = {project_id, name, description, created_by, teams, packages, locations, is_locked: false};
                plan = await getBackendAPI().addPlan(newPlan);
            } else {
                const newPlan = {_id: this.props.plan._id, project_id, name, description, created_by, teams, packages, locations, is_locked: false};
                plan = await getBackendAPI().updatePlan(newPlan);
            }
            this.setState({isEditing: false});
            this.props.onSave(plan);
        } catch (e) {
            console.log('err', e);
        }
    }

    onCancel = () => {
        this.setState({isEditing: false});
        if(!this.props.plan._id){
            this.props.onDelete();
        }
    }

    onDuplicate = () => {
        this.props.onDuplicate();
    }

    onEdit = () => {
        const {plan} = this.props;
        this.setState({
            isEditing: true,
            name: plan.name??'',
            description: plan.description??'',
            created_by: plan.created_by??'',
            teams: plan.teams??'',
            packages: plan.packages??'',
            locations: plan.locations??'',
        });
    }


    onLock = async () => {
        const {plan} = this.props;
        try {
            const newPlan = await getBackendAPI().updatePlan({...plan, is_locked: true});
            this.props.onSave(newPlan);
            this.setState({isLocked: true});
        } catch (e) {

        }
    }

    onUnlock = async () => {
        const {plan} = this.props;
        try {
            const newPlan = await getBackendAPI().updatePlan({...plan, is_locked: false});
            this.props.onSave(newPlan);
            this.setState({isLocked: false});
        } catch (e) {

        }
    }

    onDelete = async () => {
        try {
            if (this.props.plan._id) {
                await getBackendAPI().deletePlan(this.props.plan._id);
                this.props.onDelete();
            }
        } catch (e) {

        }
    }


    onClick = () => {

    }

    render (){
        const { plan } = this.props;
        const { isEditing, name, description, created_by, teams, packages, locations, isLocked } = this.state;

        if(isLocked){
            return (
                <div className="plan-container">
                    <div className="plan-header">
                        {plan.name}
                    </div>
                    <div className="plan-content d-flex flex-column">
                        <div className="flex-grow-1 align-items-center d-flex justify-content-center">
                            <i className="ti-lock plan-lock"/>
                        </div>
                        <div className="form-group btn-container">
                            <button
                                className="btn btn-primary w-md waves-effect waves-light mx-2"
                                onClick={this.onUnlock}
                            >
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return (<div className="plan-container">
            <div className="plan-header">
                {(isEditing && !plan._id)?'New Plan':plan.name}
            </div>
            {
                isEditing ?
                <div className="plan-content">
                    <form className="mt-4" action="#">
                        <div className="form-group">
                            <label htmlFor="plan_name">Phase Plan</label>
                            <input
                                type="text"
                                className="form-control"
                                id="plan_name"
                                value={name}
                                onChange={(event) => this.setState({name: event.target.value})}
                                placeholder="Enter Plan Name"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">Description</label>
                            <textarea
                                className="form-control description"
                                id="description"
                                value={description}
                                onChange={(event) => this.setState({description: event.target.value})}
                                placeholder="Enter Description"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="created_by">Created By</label>
                            <input
                                type="text"
                                className="form-control"
                                id="created_by"
                                value={created_by}
                                onChange={(event) => this.setState({created_by: event.target.value})}
                                placeholder="Enter Creator"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="created_by">Teams</label>
                            <input
                                type="text"
                                className="form-control"
                                id="teams"
                                value={teams}
                                onChange={(event) => this.setState({teams: event.target.value})}
                                placeholder="Enter Teams"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="packages">Work Packages</label>
                            <input
                                type="text"
                                className="form-control"
                                id="packages"
                                value={packages}
                                onChange={(event) => this.setState({packages: event.target.value})}
                                placeholder="Enter Packages"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="locations">Locations</label>
                            <input
                                type="text"
                                className="form-control"
                                id="locations"
                                value={locations}
                                onChange={(event) => this.setState({locations: event.target.value})}
                                placeholder="Enter Locations"
                            />
                        </div>
                        <div className="form-group btn-container">
                            <button
                                className="btn btn-primary w-md waves-effect waves-light mx-2"
                                onClick={this.onSave}
                            >
                                Save
                            </button>
                            <button
                                className="btn btn-primary w-md waves-effect waves-light"
                                onClick={this.onCancel}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
                    :
                <div className="plan-content pt-4 d-flex flex-column">
                    <div className="form-group">
                        <label className="form-label">Description:</label>
                        <label>{plan.description}</label>
                    </div>

                    <div className="form-group flex-grow-1">
                        <label className="form-label">Created By:</label>
                        <label>{plan.created_by}</label>
                    </div>
                    <div className="btn-container mb-2">
                        <div className="mb-2">
                            <button
                                className="btn btn-outline-dark w-md waves-effect waves-light mx-2"
                                onClick={this.onDuplicate}
                            >
                                Duplicate
                            </button>
                            <button
                                className="btn btn-outline-dark w-md waves-effect waves-light"
                                onClick={this.onEdit}
                            >
                                Edit
                            </button>
                        </div>
                        <div>
                            <button
                                className="btn btn-outline-dark w-md waves-effect waves-light mx-2"
                                onClick={this.onLock}
                            >
                                Lock
                            </button>
                            <button
                                className="btn btn-danger w-md waves-effect waves-light"
                                onClick={this.onDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            }
        </div>);
    }
}

export default Plan;
