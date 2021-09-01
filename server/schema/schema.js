const graphql = require('graphql');
const jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const nodemailer  = require("nodemailer");
const Config = require('../config');
const { User, Team, Member, Association, ProjectAttribute, Project, Plan, SysInfo } = require('../models/index');

const { GraphQLObjectType, GraphQLString,
       GraphQLID, GraphQLNonNull, GraphQLSchema, GraphQLList, GraphQLBoolean } = graphql;

const OriginSysPassword = 'Project21';
// Setting Mailer
var transport = {
    host: Config.mailer_host,
    port: Config.mailer_port,
    secure: true,
    auth: {
        user: Config.mailer_user,
        pass: Config.mailer_pass
    }
}

var transporter = nodemailer.createTransport(transport)

transporter.verify((error, success) => {
if (error) {
    console.log(error);
} else {
    console.log('Setting Mailer Success!');
}
});

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: () => ({
        _id: { type: GraphQLString },
        email: { type: GraphQLString },
        name: { type: GraphQLString },
        password: { type: GraphQLString },
        role: { type: GraphQLString },
        token: { type: GraphQLString }
    })
});

const ProjectAttributeType = new GraphQLObjectType({
    name: 'ProjectAttribute',
    fields: () => ({
        _id: { type: GraphQLString },
        attribute_name: { type: GraphQLString },
        tag_name: { type: GraphQLString },
        handle: { type: GraphQLString }
    })
});

const TeamType = new GraphQLObjectType({
    name: 'Team',
    fields: () => ({
        _id: { type: GraphQLString },
        name: { type: GraphQLString },
        abrv: { type: GraphQLString },
        handle: { type: GraphQLString },
        planning: { type: GraphQLString }
    })
});

const MemberType = new GraphQLObjectType({
    name: 'Member',
    fields: () => ({
        _id: { type: GraphQLString },
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        abrv: { type: GraphQLString },
        handle: { type: GraphQLString },
        email: { type: GraphQLString },
        is_registered: { type: GraphQLBoolean }
    })
});

const AssociationType = new GraphQLObjectType({
    name: 'Association',
    fields: () => ({
        _id: { type: GraphQLString },
        team_id: { type: GraphQLString },
        member_id: { type: GraphQLString },
        role: { type: GraphQLString },
        team: {
            type: TeamType,
            resolve(parent, args){
                return Team.findById(parent.team_id);
            }
        },
        member: {
            type: MemberType,
            resolve(parent, args){
                return Member.findById(parent.member_id);
            }
        }
    })
});

const ProjectType = new GraphQLObjectType({
    name: 'Project',
    fields: () => ({
        _id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        created_by_id: { type: GraphQLString },
        created_by: {
            type: UserType,
            resolve(parent){
                return User.findById(parent.created_by_id);
            }
        },
        is_locked: { type: GraphQLBoolean },
        plans: {
            type: new GraphQLList(PlanType),
            resolve(parent, args){
                return Plan.find({project_id: parent._id});
            }
        },
    })
})

const SuccessType = new GraphQLObjectType({
    name: 'Success',
    fields: () => ({
        success: {type: GraphQLBoolean}
    })
})

const PlanType = new GraphQLObjectType({
    name: 'Plan',
    fields: () => ({
        _id: { type: GraphQLString },
        project_id: { type: GraphQLString },
        name: { type: GraphQLString },
        description: { type: GraphQLString },
        created_by_id: { type: GraphQLString },
        created_by: {
            type: UserType,
            resolve(parent){
                return User.findById(parent.created_by_id);
            }
        },
        teams: { type: GraphQLString },
        packages: { type: GraphQLString },
        locations: { type: GraphQLString },
        is_locked: { type: GraphQLBoolean },
    })
})

const SendMailType = new GraphQLObjectType({
    name: 'SendMail',
    fields: () => ({
        result: { type: GraphQLString },
    })
});

const RootQuery = new GraphQLObjectType({
    name: 'RootQueryType',
    fields: {
        users: {
            type: new GraphQLList(UserType),
            resolve(parent, args) {
                return User.find({});
            }
        },
        user: {
            type: UserType,
            args: { _id: { type: GraphQLID }},
            resolve(parent, args){
                return User.findById(args._id);
            }
        },
        me: {
            type: UserType,
            args: { token: { type: GraphQLString }},
            async resolve(parent, args){
                let user = await User.findOne({ token: args.token });
                if(user){
                    let token = jwt.sign({ name: user.name }, Config.secret, {
                        expiresIn: 86400 // 24 hours
                      });
                    let now = Date.now();
                    user = {
                        _id: user._id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        token: token,
                        createdAt: user.createdAt,
                        updatedAt: now
                    };
                    User.findById(user._id, function(err, doc){
                        doc.token = token;
                        doc.updatedAt = now;
                        doc.save();
                    });
                    return user;
                }
                return null;
            }
        },
        login: {
            type: UserType,
            args: {
                    name: { type: GraphQLString },
                    password: { type: GraphQLString}
                },
            async resolve(parent, args){
                let user = await User.findOne({ name: args.name });
                if(!user){
                    return null;
                }
                let passwordIsValid =  bcrypt.compareSync(args.password, user.password);

                if(!passwordIsValid){
                    return { error: "Invalid Password!" };
                }

                return user;
            }
        },
        check: {
            type: SuccessType,
            args: {
                name: { type: GraphQLString },
                password: { type: GraphQLString}
            },
            async resolve(parent, args){
                let user = await User.findOne({ name: args.name });
                if(!user){
                    return { success: false };
                }
                let passwordIsValid =  bcrypt.compareSync(args.password, user.password);

                if(!passwordIsValid){
                    return { success: false };
                }

                return { success: true };
            }
        },
        checkSysPass: {
            type: SuccessType,
            args: {
                password: { type: GraphQLString}
            },
            async resolve(parent, args){
                let sysPass = await SysInfo.findOne({ key: 'system_password' });
                if(!sysPass){
                    const salt = bcrypt.genSaltSync(10);
                    sysPass = new SysInfo({
                        key: 'system_password',
                        value: bcrypt.hashSync(OriginSysPassword, salt)
                    });
                    sysPass.save();
                    if(args.password !== OriginSysPassword){
                        return { success: false };
                    }
                } else {
                    let passwordIsValid =  bcrypt.compareSync(args.password, sysPass.value);
                    if(!passwordIsValid){
                        return { success: false };
                    }
                }
                return { success: true };
            }
        },
        project_attributes: {
            type: new GraphQLList(ProjectAttributeType),
            args:{ attribute_name: { type: GraphQLString}},
            async resolve(parent, args){
                return ProjectAttribute.find({"attribute_name": args.attribute_name});
            }
        },
        all_project_attributes: {
            type: new GraphQLList(ProjectAttributeType),
            async resolve(parent, args){
                return ProjectAttribute.find({});
            }
        },
        teams: {
            type: new GraphQLList(TeamType),
            async resolve(parent, args){
                return Team.find({});
            }
        },
        members: {
            type: new GraphQLList(MemberType),
            async resolve(parent, args){
                return Member.find({});
            }
        },
        member: {
            type: MemberType,
            args: { id: { type: GraphQLString }},
            async resolve(parent, args){
                return Member.findById(args.id);
            }
        },
        associations: {
            type: new GraphQLList(AssociationType),
            async resolve(parent, args){
                return Association.find({});
            }
        },
        projects: {
            type: new GraphQLList(ProjectType),
            async resolve(parent, args){
                return Project.find({});
            }
        }
    }
});

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        register: {
            type: UserType,
            args: {
                email: { type: new GraphQLNonNull(GraphQLString) },
                name: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
                role: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(parent, args){

                const exist = await User.findOne({ name: args.name });
                if(exist){
                    return null;
                }

                const token = jwt.sign({ name: args.name }, Config.secret, {
                    expiresIn: 86400 // 24 hours
                  });
                const now = Date.now();

                const salt = bcrypt.genSaltSync(10);

                let user = new User({
                    email: args.email,
                    name: args.name,
                    password: bcrypt.hashSync(args.password, salt),
                    role: args.role,
                    token: token,
                    createdAt: now,
                    updatedAt: now
                });
                return user.save();
            }
        },
        registerFromMember: {
            type: UserType,
            args: {
                email: { type: new GraphQLNonNull(GraphQLString) },
                name: { type: new GraphQLNonNull(GraphQLString) },
                password: { type: new GraphQLNonNull(GraphQLString) },
                member_id: { type: new GraphQLNonNull(GraphQLString) }
            },
            async resolve(parent, args){
                let exist = await User.findOne({ name: args.name });
                if(exist){
                    return null;
                }

                exist = await User.findOne({ email: args.email });
                if(exist){
                    return null;
                }

                const token = jwt.sign({ name: args.name }, Config.secret, {
                    expiresIn: 86400 // 24 hours
                  });
                const now = Date.now();

                const salt = bcrypt.genSaltSync(10);

                let user = new User({
                    email: args.email,
                    name: args.name,
                    password: bcrypt.hashSync(args.password, salt),
                    token: token,
                    createdAt: now,
                    updatedAt: now
                });
                Member.findById(args.member_id, function(err, doc){
                    doc.is_registered = true;
                    doc.save();
                });
                return user.save();
            }
        },
        changePassword: {
            type: SuccessType,
            args: {
                _id: {type: GraphQLString},
                oldpass: {type: GraphQLString},
                newpass: {type: GraphQLString}
            },
            async resolve(parent, args){
                let user = await User.findById(args._id);
                if(!user){
                    return { success: false };
                }
                let passwordIsValid =  bcrypt.compareSync(args.oldpass, user.password);

                if(!passwordIsValid){
                    return { success: false };
                }

                const salt = bcrypt.genSaltSync(10);
                user.password = bcrypt.hashSync(args.newpass, salt);
                user.save();

                return { success: true };
            }
        },
        changeSysPassword: {
            type: SuccessType,
            args: {
                oldpass: {type: GraphQLString},
                newpass: {type: GraphQLString}
            },
            async resolve(parent, args){
                let sysPass = await SysInfo.findOne({key: 'system_password'});
                const salt = bcrypt.genSaltSync(10);

                if(!sysPass){
                    sysPass = new SysInfo({
                        key: 'system_password',
                        value: bcrypt.hashSync(OriginSysPassword, salt)
                    });
                    sysPass.save();
                    if(args.oldpass !== OriginSysPassword){
                        return { success: false };
                    }
                } else {
                    let passwordIsValid =  bcrypt.compareSync(args.oldpass, sysPass.value);

                    if(!passwordIsValid){
                        return { success: false };
                    }
                }

                sysPass.value = bcrypt.hashSync(args.newpass, salt);
                sysPass.save();

                return { success: true };
            }
        },
        add_project_attribute: {
            type: ProjectAttributeType,
            args: {
                attribute_name: { type: GraphQLString },
                tag_name: { type: GraphQLString },
                handle: { type: GraphQLString }
            },
            resolve(parent, args){
                let attribute = new ProjectAttribute({
                    attribute_name: args.attribute_name,
                    tag_name: args.tag_name,
                    handle: args.handle
                });
                return attribute.save();
            }
        },
        add_team: {
            type: TeamType,
            args: {
                name: { type: GraphQLString },
                abrv: { type: GraphQLString },
                handle: { type: GraphQLString },
                planning: { type: GraphQLString }
            },
            resolve(parent, args){
                let team = new Team({
                    name: args.name,
                    abrv: args.abrv,
                    handle: args.handle,
                    planning: args.planning
                })
                return team.save();
            }
        },
        add_member: {
            type: MemberType,
            args: {
                first_name: { type: GraphQLString },
                last_name: { type: GraphQLString },
                abrv: { type: GraphQLString },
                handle: { type: GraphQLString },
                email: { type: GraphQLString }
            },
            resolve(parent, args){
                let member = new Member({
                    first_name: args.first_name,
                    last_name: args.last_name,
                    abrv: args.abrv,
                    handle: args.handle,
                    email: args.email,
                    is_registered: false,
                })
                return member.save();
            }
        },
        add_association: {
            type: AssociationType,
            args: {
                team_id: { type: GraphQLString },
                member_id: { type: GraphQLString },
                role: { type: GraphQLString }
            },
            resolve(parent, args){
                let association = new Association({
                    team_id: args.team_id,
                    member_id: args.member_id,
                    role: args.role
                })
                return association.save();
            }
        },
        add_project: {
            type: ProjectType,
            args: {
                name: { type: GraphQLString },
                description: { type: GraphQLString },
                created_by_id: { type: GraphQLString },
                is_locked: { type: GraphQLBoolean }
            },
            resolve(parent, args){
                let project = new Project({
                    name: args.name,
                    description: args.description,
                    created_by_id: args.created_by_id,
                    is_locked: args.is_locked
                })
                return project.save();
            }
        },
        update_project: {
            type: ProjectType,
            args: {
                _id: { type: GraphQLString },
                name: { type: GraphQLString },
                description: { type: GraphQLString },
                created_by_id: { type: GraphQLString },
                is_locked: { type: GraphQLBoolean }
            },
            async resolve(parent, args){
                let project = await Project.findById(args._id);
                project.name = args.name;
                project.description = args.description;
                project.created_by_id = args.created_by_id;
                project.is_locked = args.is_locked;
                return project.save();
            }
        },
        delete_project: {
            type: SuccessType,
            args: {
                _id: { type: GraphQLString }
            },
            async resolve(parent, args){
                await Project.findByIdAndDelete(args._id);
                await Plan.deleteMany({project_id: args._id});
                return {success: true};
            }
        },
        add_plan: {
            type: PlanType,
            args: {
                project_id: { type: GraphQLString },
                name: { type: GraphQLString },
                description: { type: GraphQLString },
                created_by_id: { type: GraphQLString },
                teams: { type: GraphQLString },
                packages: { type: GraphQLString },
                locations: { type: GraphQLString },
                is_locked: { type: GraphQLBoolean }
            },
            resolve(parent, args){
                let plan = new Plan({
                    project_id: args.project_id,
                    name: args.name,
                    description: args.description,
                    created_by_id: args.created_by_id,
                    teams: args.teams,
                    packages: args.packages,
                    locations: args.locations,
                    is_locked: args.is_locked
                })
                return plan.save();
            }
        },
        update_plan: {
            type: PlanType,
            args: {
                _id: { type: GraphQLString },
                name: { type: GraphQLString },
                description: { type: GraphQLString },
                created_by_id: { type: GraphQLString },
                teams: { type: GraphQLString },
                packages: { type: GraphQLString },
                locations: { type: GraphQLString },
                is_locked: { type: GraphQLBoolean }
            },
            async resolve(parent, args){
                let plan = await Plan.findById(args._id);
                plan.name = args.name;
                plan.description = args.description;
                plan.created_by_id = args.created_by_id;
                plan.teams = args.teams;
                plan.packages = args.packages;
                plan.locations = args.locations;
                plan.is_locked = args.is_locked;
                return plan.save();
            }
        },
        delete_plan: {
            type: SuccessType,
            args: {
                _id: { type: GraphQLString }
            },
            async resolve(parent, args){
                await Plan.findByIdAndDelete(args._id);
                return {success: true};
            }
        },
        send_mail:{
            type: SendMailType,
            args: {
                member_id: { type: GraphQLString },
                email: { type: GraphQLString },
            },
            resolve(parent, args){
                let member_id = args.member_id;
                let data = {
                    from: Config.mailer_user,
                    to: args.email,
                    subject: "Veltrix Require Password",
                    text: `Please Create Password in ${Config.server_base_url}/create-password?id=${member_id}`,
                    html: `<span>Please Create Password in <a href="${Config.server_base_url}/create-password?id=${member_id}">here</a></span>`
                };

                transporter.sendMail(data, function(err, info){
                    if(err){
                        console.log('Send Mail Failed: ', err);
                    } else {
                        console.log('Sned Mail Success: ', info);
                    }
                });

                return { result: "success"};
            }
        }
    }
})

module.exports = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
});
