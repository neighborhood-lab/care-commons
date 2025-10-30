"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientDetail = void 0;
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const hooks_1 = require("@/core/hooks");
const utils_1 = require("@/core/utils");
const hooks_2 = require("../hooks");
const ClientDetail = () => {
    const { id } = (0, react_router_dom_1.useParams)();
    const navigate = (0, react_router_dom_1.useNavigate)();
    const { can } = (0, hooks_1.usePermissions)();
    const { data: client, isLoading, error, refetch } = (0, hooks_2.useClient)(id);
    const deleteClient = (0, hooks_2.useDeleteClient)();
    const handleDelete = async () => {
        if (!client || !window.confirm('Are you sure you want to delete this client?')) {
            return;
        }
        try {
            await deleteClient.mutateAsync(client.id);
            navigate('/clients');
        }
        catch (error) {
        }
    };
    if (isLoading) {
        return (<div className="flex justify-center items-center py-12">
        <components_1.LoadingSpinner size="lg"/>
      </div>);
    }
    if (error || !client) {
        return (<components_1.ErrorMessage message={error?.message || 'Failed to load client'} retry={refetch}/>);
    }
    const fullName = [client.firstName, client.middleName, client.lastName]
        .filter(Boolean)
        .join(' ');
    return (<div className="space-y-6">
      <div className="flex items-center gap-4">
        <react_router_dom_1.Link to="/clients">
          <components_1.Button variant="ghost" size="sm" leftIcon={<lucide_react_1.ArrowLeft className="h-4 w-4"/>}>
            Back
          </components_1.Button>
        </react_router_dom_1.Link>
      </div>

      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {client.preferredName || fullName}
          </h1>
          <p className="text-gray-600 mt-1">{client.clientNumber}</p>
        </div>
        <div className="flex gap-2">
          <components_1.StatusBadge status={client.status}/>
          {can('clients:write') && (<>
              <react_router_dom_1.Link to={`/clients/${client.id}/edit`}>
                <components_1.Button variant="outline" leftIcon={<lucide_react_1.Edit className="h-4 w-4"/>}>
                  Edit
                </components_1.Button>
              </react_router_dom_1.Link>
              <components_1.Button variant="danger" leftIcon={<lucide_react_1.Trash2 className="h-4 w-4"/>} onClick={handleDelete} isLoading={deleteClient.isPending}>
                Delete
              </components_1.Button>
            </>)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <components_1.Card>
            <components_1.CardHeader title="Personal Information"/>
            <components_1.CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{fullName}</dd>
                </div>
                {client.preferredName && (<div>
                    <dt className="text-sm font-medium text-gray-500">Preferred Name</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.preferredName}</dd>
                  </div>)}
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {(0, utils_1.formatDate)(client.dateOfBirth)}
                  </dd>
                </div>
                {client.gender && (<div>
                    <dt className="text-sm font-medium text-gray-500">Gender</dt>
                    <dd className="mt-1 text-sm text-gray-900">{client.gender}</dd>
                  </div>)}
              </dl>
            </components_1.CardContent>
          </components_1.Card>

          <components_1.Card>
            <components_1.CardHeader title="Contact Information"/>
            <components_1.CardContent>
              <div className="space-y-4">
                {client.primaryPhone && (<div className="flex items-center gap-3">
                    <lucide_react_1.Phone className="h-5 w-5 text-gray-400"/>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {(0, utils_1.formatPhone)(client.primaryPhone.number)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {client.primaryPhone.type}
                        {client.primaryPhone.canReceiveSMS && ' • SMS Enabled'}
                      </p>
                    </div>
                  </div>)}
                {client.email && (<div className="flex items-center gap-3">
                    <lucide_react_1.Mail className="h-5 w-5 text-gray-400"/>
                    <p className="text-sm text-gray-900">{client.email}</p>
                  </div>)}
                <div className="flex items-start gap-3">
                  <lucide_react_1.MapPin className="h-5 w-5 text-gray-400 mt-0.5"/>
                  <div>
                    <p className="text-sm text-gray-900">{client.primaryAddress.line1}</p>
                    {client.primaryAddress.line2 && (<p className="text-sm text-gray-900">{client.primaryAddress.line2}</p>)}
                    <p className="text-sm text-gray-900">
                      {client.primaryAddress.city}, {client.primaryAddress.state}{' '}
                      {client.primaryAddress.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </components_1.CardContent>
          </components_1.Card>

          {client.emergencyContacts.length > 0 && (<components_1.Card>
              <components_1.CardHeader title="Emergency Contacts"/>
              <components_1.CardContent>
                <div className="space-y-4">
                  {client.emergencyContacts.map((contact) => (<div key={contact.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{contact.name}</p>
                          <p className="text-sm text-gray-600">{contact.relationship}</p>
                        </div>
                        {contact.isPrimary && (<span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                            Primary
                          </span>)}
                      </div>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600">
                          {(0, utils_1.formatPhone)(contact.phone.number)}
                        </p>
                        {contact.email && (<p className="text-sm text-gray-600">{contact.email}</p>)}
                        {contact.canMakeHealthcareDecisions && (<p className="text-xs text-gray-500">
                            Authorized for healthcare decisions
                          </p>)}
                      </div>
                    </div>))}
                </div>
              </components_1.CardContent>
            </components_1.Card>)}
        </div>

        <div className="space-y-6">
          <components_1.Card>
            <components_1.CardHeader title="Quick Actions"/>
            <components_1.CardContent>
              <div className="space-y-2">
                <components_1.Button variant="outline" size="sm" className="w-full justify-start">
                  <lucide_react_1.Calendar className="h-4 w-4 mr-2"/>
                  Schedule Visit
                </components_1.Button>
                <components_1.Button variant="outline" size="sm" className="w-full justify-start">
                  <lucide_react_1.User className="h-4 w-4 mr-2"/>
                  Assign Caregiver
                </components_1.Button>
                <components_1.Button variant="outline" size="sm" className="w-full justify-start">
                  <lucide_react_1.Phone className="h-4 w-4 mr-2"/>
                  Call Client
                </components_1.Button>
              </div>
            </components_1.CardContent>
          </components_1.Card>

          <components_1.Card>
            <components_1.CardHeader title="Timeline"/>
            <components_1.CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 mt-2 rounded-full bg-green-500"/>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Client Created</p>
                    <p className="text-xs text-gray-600">
                      {(0, utils_1.formatDate)(client.createdAt)}
                    </p>
                  </div>
                </div>
                {client.intakeDate && (<div className="flex items-start gap-3">
                    <div className="h-2 w-2 mt-2 rounded-full bg-blue-500"/>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Intake Completed</p>
                      <p className="text-xs text-gray-600">
                        {(0, utils_1.formatDate)(client.intakeDate)}
                      </p>
                    </div>
                  </div>)}
              </div>
            </components_1.CardContent>
          </components_1.Card>
        </div>
      </div>
    </div>);
};
exports.ClientDetail = ClientDetail;
//# sourceMappingURL=ClientDetail.js.map