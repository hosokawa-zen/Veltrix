import React, {Component} from "react";
import {Row, Col, Button, Label, Input, Modal} from "reactstrap";
import {Link} from "react-router-dom";
import Board from 'react-trello';
import {MovableCardWrapper} from 'react-trello/dist/styles/Base';

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import {getBackendAPI} from "../../helpers/backend";
import {connect} from "react-redux";

const ConstraintCard = ({
                            onClick,
                            id,
                            constraint,
                            email,
                            team,
                            work_package,
                            check_list,
                            comments,
                            status
                        }) => {
    return (
        <MovableCardWrapper>
            <header
                style={{
                    borderBottom: '1px solid #eee',
                    paddingBottom: 6,
                    marginBottom: 10,
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                }}>
                <div style={{fontSize: 14, fontWeight: 'bold'}}>{constraint}</div>
            </header>
            <div style={{padding: '5px 0px'}}>
                {email}
            </div>
            <div style={{padding: '5px 0px'}}>
                Team: {team}
            </div>
            <div style={{padding: '5px 0px'}}>
                Work Package: {work_package}
            </div>
            <div style={{padding: '5px 0px'}}>
                {check_list}
            </div>
            <div style={{padding: '5px 0px'}}>
                {comments}
            </div>
        </MovableCardWrapper>
    )
}


class ConstraintsLogPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: {lanes: [{id: 'loading', title: 'loading..', cards: []}]},
            teams: [],
            workPackages: [],
            addConstraintModal: false,
            eventBus: undefined,
        };
        this.addConstraintModalHandler = this.addConstraintModalHandler.bind(this);
        this.init();
    }

    componentDidMount() {
    }

    setEventBus = handle => {
        this.setState({
            eventBus: handle
        })
    }

    init = async () => {
        let teams = await getBackendAPI().getTeams();
        let attributes = await getBackendAPI().allProjectAttributes();
        let workPackages = attributes.filter(item => item.attribute_name === 'Work Package');
        this.setState({
            teams: teams,
            workPackages: workPackages,
        });
        let all_constraints = await getBackendAPI().getAllConstraints();
        let lane1 = [];
        let lane2 = [];
        let lane3 = [];
        let lane4 = [];
        all_constraints.forEach((item) => {
            let data = {
                id: item._id,
                constraint: item.constraint,
                email: item.user.email,
                team: item.team_info.name,
                work_package: item.work_package_info.tag_name,
                check_list: item.check_list,
                comments: item.comments,
                status: item.status,
            };
            switch (item.status) {
                case 1:
                    lane1.push(data);
                    break;
                case 2:
                    lane2.push(data);
                    break;
                case 3:
                    lane3.push(data);
                    break;
                case 4:
                    lane4.push(data);
                    break;
                default:
                    lane1.push(data);
                    break;
            }
        });

        let boardData = {
            lanes: [
                {
                    id: 'constraint',
                    title: 'Constraint',
                    label: lane1.length.toString(),
                    currentPage: 1,
                    cards: lane1
                },
                {
                    id: 'work_in_progress',
                    title: 'Work In Progress',
                    label: lane2.length.toString(),
                    currentPage: 1,
                    cards: lane2
                },
                {
                    id: 'blocked',
                    title: 'Blocked',
                    label: lane3.length.toString(),
                    currentPage: 1,
                    cards: lane3
                }, {
                    id: 'completed',
                    title: 'Completed',
                    label: lane4.length.toString(),
                    currentPage: 1,
                    cards: lane4
                }
            ]
        }
        this.setState({
            teams: teams,
            workPackages: workPackages,
            data: boardData
        });
    }

    addConstraintToTrello(item) {
        const {data} = this.state;
        data.lanes[item.status - 1].cards.push(item);
        console.log('add', item, data);
        this.setState({
            data: data
        });
    }

    removeBodyCss() {
        document.body.classList.add("no_padding");
    }

    addConstraintModalHandler() {
        this.setState(prevState => ({
            addConstraintModal: !prevState.addConstraintModal
        }));
        this.removeBodyCss();
    }

    addConstraint = () => {
        let constraint = document.getElementById('constraint').value.trim();
        let team = document.getElementById("team").value.trim();
        let workPackage = document.getElementById("work_package").value.trim();
        let checklist = document.getElementById("checklist").value.trim();
        let comments = document.getElementById("comments").value.trim();

        if (constraint.length && team.length && workPackage.length && checklist.length && comments.length) {
            try {
                getBackendAPI().addConstraint(constraint, this.props.user._id, team, workPackage, checklist, comments, 1).then((new_constraint) => {
                    console.log('constrant', new_constraint);
                    let item = {
                        id: new_constraint._id,
                        constraint: new_constraint.constraint,
                        email: new_constraint.user.email,
                        team: new_constraint.team_info.name,
                        work_package: new_constraint.work_package_info.tag_name,
                        check_list: new_constraint.check_list,
                        comments: new_constraint.comments,
                        status: new_constraint.status,
                    };
                    //this.addConstraintToTrello(item);
                    this.state.eventBus.publish({type: 'ADD_CARD', laneId: 'constraint', card: item});
                    this.setState({
                        addConstraintModal: false,
                    });
                })

            } catch (e) {

            }
        }
    }

    onCardMoveAcrossLanes = async (fromLaneId, toLaneId, cardId, addedIndex) => {
        console.log(fromLaneId);
        console.log(toLaneId);
        let sourceID = this.getStatusValue(fromLaneId);
        let targetID = this.getStatusValue(toLaneId);
        try {
            await getBackendAPI().updateConstraintsPosition({_id: cardId, target: targetID, source: sourceID, user_id: this.props.user._id});
        } catch (e) {
        }
    }

    getStatusValue = value => {
        switch (value) {
            case "constraint":
                return 1;
            case "work_in_progress":
                return 2;
            case "blocked":
                return 3;
            case "completed":
                return 4;
            default:
                return 1;
        }
    }

    render() {
        const {teams, workPackages} = this.state;
        return (
            <React.Fragment>
                <div className="container-fluid">
                    <Row className="align-items-center">
                        <Col sm={6}>
                            <div className="page-title-box">
                                <h4 className="font-size-18">Constraints Log</h4>
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item">
                                        <Link to="/#">Product Control</Link>
                                    </li>
                                    <li className="breadcrumb-item active">Constraints Log</li>
                                </ol>
                            </div>
                        </Col>
                        <Col sm={6}>
                            <div className="float-right d-none d-md-block">
                                <Button type="button"
                                        color="primary"
                                        className="btn btn-primary waves-effect waves-light"
                                        onClick={this.addConstraintModalHandler}
                                        data-toggle="modal"
                                        data-target=".bs-example-modal-lg .bs-example-modal-center">
                                    Add Constraint
                                </Button>
                                <Modal
                                    className="modal-lg modal-dialog-centered"
                                    isOpen={this.state.addConstraintModal}
                                    toggle={this.addConstraintModalHandler}
                                >
                                    <div className="modal-header">
                                        <h5
                                            className="modal-title mt-0"
                                            id="add_team_modal"
                                        >
                                            Add Constraint
                                        </h5>
                                        <button
                                            onClick={() =>
                                                this.setState({addConstraintModal: false})
                                            }
                                            type="button"
                                            className="close"
                                            data-dismiss="modal"
                                            aria-label="Close"
                                        >
                                            <span aria-hidden="true">&times;</span>
                                        </button>
                                    </div>
                                    <div className="modal-body">
                                        <div className="mt-4">
                                            <Row className="align-items-end">
                                                <Col lg="12" className="form-group">
                                                    <Label for="constraint">Constraint</Label>
                                                    <Input
                                                        ref={(r) => this.constraint = r}
                                                        type="text"
                                                        id="constraint"
                                                        name="constraint"
                                                    />
                                                </Col>
                                                <Col lg="12" className="form-group">
                                                    <Label for="team">Team</Label>
                                                    <select id="team" name="team" className="form-control">
                                                        {teams.map(item => (
                                                            <option key={item._id} value={item._id}>{item.name}</option>
                                                        ))}
                                                    </select>
                                                </Col>
                                                <Col lg="12" className="form-group">
                                                    <Label for="work_package">workPackages</Label>
                                                    <select id="work_package" name="work_package" className="form-control">
                                                        {workPackages.map(item => (
                                                            <option key={item._id} value={item._id}>{item.tag_name}</option>
                                                        ))}
                                                    </select>
                                                </Col>
                                                <Col lg="12" className="form-group">
                                                    <Label for="checklist">Checklist</Label>
                                                    <Input
                                                        ref={(r) => this.checklist = r}
                                                        type="text"
                                                        id="checklist"
                                                        name="checklist"
                                                    />
                                                </Col>
                                                <Col lg="12" className="form-group">
                                                    <Label for="comments">Comments</Label>
                                                    <Input
                                                        ref={(r) => this.comments = r}
                                                        type="text"
                                                        id="comments"
                                                        name="comments"
                                                    />
                                                </Col>
                                            </Row>
                                        </div>

                                    </div>
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={this.addConstraint}
                                        >
                                            Add
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-secondary"
                                            onClick={() =>
                                                this.setState({addConstraintModal: false})
                                            }
                                        >
                                            Close
                                        </button>
                                    </div>
                                </Modal>
                            </div>
                        </Col>
                    </Row>
                    <Board
                        data={this.state.data}
                        draggable
                        cardDragClass="draggingCard"
                        laneDraggable={false}
                        className="boardContainer"
                        components={{Card: ConstraintCard}}
                        onCardClick={(cardId) => alert("Test")}
                        onCardMoveAcrossLanes={this.onCardMoveAcrossLanes}
                        eventBusHandle={this.setEventBus}
                    />
                </div>
            </React.Fragment>
        );
    }
}

const mapStateToProps = state => {
    return {
        user: state.Login.user,
    }
}


export default connect(mapStateToProps, null)(ConstraintsLogPage);
