"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskCard = void 0;
const react_1 = __importDefault(require("react"));
const lucide_react_1 = require("lucide-react");
const components_1 = require("@/core/components");
const utils_1 = require("@/core/utils");
const hooks_1 = require("../hooks");
const TaskCard = ({ task, showCompleteButton = false, onCompleted }) => {
    const completeTask = (0, hooks_1.useCompleteTask)();
    const handleComplete = async () => {
        try {
            await completeTask.mutateAsync({
                id: task.id,
                input: { completionNote: 'Task completed via dashboard' }
            });
            onCompleted?.();
        }
        catch (error) {
        }
    };
    const isOverdue = new Date(task.scheduledDate) < new Date() &&
        task.status === 'SCHEDULED';
    return (<components_1.Card padding="md" className="h-full">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">
            {task.name}
          </h3>
          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
          <p className="text-xs text-gray-500 mt-1">
            {task.category.replace(/_/g, ' ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <components_1.StatusBadge status={task.status}/>
          {isOverdue && (<div className="flex items-center gap-1 text-xs text-red-600">
              <lucide_react_1.AlertTriangle className="h-3 w-3"/>
              Overdue
            </div>)}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <lucide_react_1.Calendar className="h-4 w-4"/>
          {(0, utils_1.formatDate)(task.scheduledDate)}
          {task.scheduledTime && (<span>at {(0, utils_1.formatTime)(task.scheduledTime)}</span>)}
        </div>

        {task.assignedCaregiverId && (<div className="flex items-center gap-2 text-sm text-gray-600">
            <lucide_react_1.User className="h-4 w-4"/>
            Assigned to: {task.assignedCaregiverId}
          </div>)}

        {task.estimatedDuration && (<div className="flex items-center gap-2 text-sm text-gray-600">
            <lucide_react_1.Clock className="h-4 w-4"/>
            Est. {task.estimatedDuration} minutes
          </div>)}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          {task.requiredSignature && (<span className="flex items-center gap-1">
              <lucide_react_1.CheckCircle className="h-3 w-3"/>
              Signature Required
            </span>)}
          {task.requiredNote && (<span className="flex items-center gap-1">
              <lucide_react_1.Clock className="h-3 w-3"/>
              Note Required
            </span>)}
        </div>

        {task.instructions && (<div className="mt-3 p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700 font-medium mb-1">Instructions:</p>
            <p className="text-sm text-gray-600">{task.instructions}</p>
          </div>)}

        {showCompleteButton && task.status === 'SCHEDULED' && (<div className="mt-4">
            <components_1.Button size="sm" leftIcon={<lucide_react_1.CheckCircle className="h-4 w-4"/>} onClick={handleComplete} isLoading={completeTask.isPending} className="w-full">
              Complete Task
            </components_1.Button>
          </div>)}

        {task.completionNote && (<div className="mt-3 p-3 bg-green-50 rounded-md">
            <p className="text-sm text-green-700 font-medium mb-1">Completion Note:</p>
            <p className="text-sm text-green-600">{task.completionNote}</p>
            {task.completedAt && (<p className="text-xs text-green-500 mt-1">
                Completed on {(0, utils_1.formatDate)(task.completedAt)}
              </p>)}
          </div>)}
      </div>
    </components_1.Card>);
};
exports.TaskCard = TaskCard;
//# sourceMappingURL=TaskCard.js.map