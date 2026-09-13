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
    deleteTask: (task: Task) => void;
    resetState: () => void;
    taskName: string;
    taskDeadlineDate: string;
    taskDeadline: string;
    taskCycle: string;
    getTaskName: (event: ChangeEvent<HTMLInputElement>) => void;
    getTaskDeadlineDate: (event: ChangeEvent<HTMLInputElement>) => void;
    getTaskDeadline: (event: ChangeEvent<HTMLInputElement>) => void;
    getTaskCycle: (event: React.ChangeEvent<HTMLSelectElement>) => void;
    updateTask: (task: Task) => boolean | void;
    handleSetNotification: (task: Task) => Promise<void>;
    makeTargetDate: (task: Task) => Date;
    scheduleNotification: (task: Task, notificationDate: Date) => void;
    getNextNotificationDate: (currentDate: Date, cycle: string) => Date;
    handleEdit: (task: Task) => void;
}

const TaskList = ( {
    tasks,
    deleteTask,
    resetState,
    taskName,
    taskDeadlineDate,
    taskDeadline,
    taskCycle,
    getTaskName,
    getTaskDeadlineDate,
    getTaskDeadline,
    getTaskCycle,
    updateTask,
    handleSetNotification,
    makeTargetDate,
    scheduleNotification,
    getNextNotificationDate,
    handleEdit} : TaskSettingsProps ) => {

    return tasks.map((task) => (
    <TaskContents
        key={task.id}
        task={task}
        deleteTask={deleteTask}
        resetState={resetState}
        taskName={taskName}
        taskDeadlineDate={taskDeadlineDate}
        taskDeadline={taskDeadline}
        taskCycle={taskCycle}
        getTaskName={getTaskName}
        getTaskDeadlineDate={getTaskDeadlineDate}
        getTaskDeadline={getTaskDeadline}
        getTaskCycle={getTaskCycle}
        updateTask={updateTask}
        handleSetNotification={handleSetNotification}
        makeTargetDate={makeTargetDate}
        scheduleNotification={scheduleNotification}
        getNextNotificationDate={getNextNotificationDate}
        handleEdit={handleEdit}
    />))
}

export default TaskList