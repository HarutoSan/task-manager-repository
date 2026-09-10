import type { ChangeEvent } from "react";
import TaskContents from "./TaskContents";

type Task = {
    id: string;
    name: string;
    date: string;
    deadline: string;
    cycle: string;
    notified: boolean;
};

type TaskSettingsProps = {
    tasks: Task[];
    onDelete: (taskId: string) => void;
    resetState: () => void;
    taskName: string;
    taskDeadlineDate: string;
    taskDeadline: string;
    getTaskName: (event: ChangeEvent<HTMLInputElement>) => void;
    getTaskDeadlineDate: (event: ChangeEvent<HTMLInputElement>) => void;
    getTaskDeadline: (event: ChangeEvent<HTMLInputElement>) => void;
    getTaskCycle: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    onUpdate: (taskId: string) => void;
    handleSetNotification: (task: Task) => Promise<void>;
    makeTargetDate: (task: Task) => Date;
    scheduleNotification: (task: Task, taskId: string, notificationDate: Date) => void;
    getNextNotificationDate: (currentDate: Date, cycle: string) => Date;
    handleEdit: (task: Task) => void;
}

const TaskList = ( {
    tasks,
    onDelete,
    resetState,
    taskName,
    taskDeadlineDate,
    taskDeadline,
    getTaskName,
    getTaskDeadlineDate,
    getTaskDeadline,
    getTaskCycle,
    onUpdate,
    handleSetNotification,
    makeTargetDate,
    scheduleNotification,
    getNextNotificationDate,
    handleEdit} : TaskSettingsProps ) => {

    return tasks.map((task) => (
    <TaskContents
        key={task.id}
        task={task}
        onDelete={onDelete}
        resetState={resetState}
        taskName={taskName}
        taskDeadlineDate={taskDeadlineDate}
        taskDeadline={taskDeadline}
        getTaskName={getTaskName}
        getTaskDeadlineDate={getTaskDeadlineDate}
        getTaskDeadline={getTaskDeadline}
        getTaskCycle={getTaskCycle}
        onUpdate={onUpdate}
        handleSetNotification={handleSetNotification}
        makeTargetDate={makeTargetDate}
        scheduleNotification={scheduleNotification}
        getNextNotificationDate={getNextNotificationDate}
        handleEdit={handleEdit}
    />))
}

export default TaskList