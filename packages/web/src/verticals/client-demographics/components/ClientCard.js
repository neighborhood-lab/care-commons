"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientCard = void 0;
const react_1 = __importDefault(require("react"));
const react_router_dom_1 = require("react-router-dom");
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const utils_1 = require("@/core/utils");
const ClientCard = ({ client, compact = false }) => {
    const fullName = [client.firstName, client.middleName, client.lastName]
        .filter(Boolean)
        .join(' ');
    return (<react_router_dom_1.Link to={`/clients/${client.id}`}>
      <components_1.Card padding="md" hover className="h-full">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {client.preferredName || fullName}
            </h3>
            <p className="text-sm text-gray-600">{client.clientNumber}</p>
          </div>
          <components_1.StatusBadge status={client.status}/>
        </div>

        {!compact && (<div className="mt-4 space-y-2">
            {client.primaryPhone && (<div className="flex items-center gap-2 text-sm text-gray-600">
                <lucide_react_1.Phone className="h-4 w-4"/>
                {(0, utils_1.formatPhone)(client.primaryPhone.number)}
              </div>)}
            {client.email && (<div className="flex items-center gap-2 text-sm text-gray-600">
                <lucide_react_1.Mail className="h-4 w-4"/>
                {client.email}
              </div>)}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <lucide_react_1.MapPin className="h-4 w-4"/>
              {client.primaryAddress.city}, {client.primaryAddress.state}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <lucide_react_1.Calendar className="h-4 w-4"/>
              DOB: {(0, utils_1.formatDate)(client.dateOfBirth)}
            </div>
          </div>)}
      </components_1.Card>
    </react_router_dom_1.Link>);
};
exports.ClientCard = ClientCard;
//# sourceMappingURL=ClientCard.js.map