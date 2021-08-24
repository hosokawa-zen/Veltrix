import React, { Component } from "react";
import SettingMenu from "../Shared/SettingMenu";
import { Row, Col, Card, CardBody } from "reactstrap";
import { Link } from "react-router-dom";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

class MakeReadyPlanPage extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {}

  render() {
    return (
      <React.Fragment>
        <div className="container-fluid">
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

          <Row>
			
          </Row>
        </div>
      </React.Fragment>
    );
  }
}

export default MakeReadyPlanPage;
