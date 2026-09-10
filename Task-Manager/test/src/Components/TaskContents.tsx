import type { ChangeEvent } from "react";

type Task = {
    id: string;
    name: string;
    date: string;
    deadline: string;
    cycle: string;
    notified: boolean;
};

type TaskSettingsProps = {
    task: Task;
    onDelete: (taskId: string) => void;
    resetState: () => void;
    taskName: string;
    taskDeadlineDate: string;
    taskDeadline: string;
    taskCycle: string;
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

const TaskContents = ( {
    task,
    onDelete,
    resetState,
    taskName,
    taskDeadlineDate,
    taskDeadline,
    taskCycle,
    getTaskName,
    getTaskDeadlineDate,
    getTaskDeadline,
    getTaskCycle,
    onUpdate,
    makeTargetDate,
    scheduleNotification,
    getNextNotificationDate,
    handleEdit} : TaskSettingsProps ) => {

    const updateTask = () => {
        onUpdate(task.id);
        resetState();
    };

    const handleComplete = (task: Task) => {
        if (task.cycle === "none") {
            // 繰り返しなし → ポップアップを開かずに削除
            onDelete(task.id);
        } else {
            // 繰り返しあり → ポップアップを開く
            const popover = document.getElementById(
                `RefTaskComplete-${task.id}`
            );
        popover?.showPopover();
        }
    };

    /*
    const handleEdit = (task: Task) => {
        setTaskName(task.name);
        setTaskDeadlineDate(task.date);
        setTaskDeadline(task.deadline);
        setCycle(task.cycle);
    };
    */
    
        return (
        <>
        <div>
            <p>タスク名: {task.name}</p>
            <p>締切日: {task.date}</p>
            <p>時刻: {task.deadline}</p>
            <p>繰り返し: {task.cycle}</p>
        </div>
        <div>
            <button onClick={() => handleComplete(task)}>タスクを完了</button>
            <button onClick={() => handleEdit(task)} popoverTarget={`RefTaskSettings-${task.id}`}>タスクを編集</button>
            <button onClick={() => onDelete(task.id)}>タスクを削除</button>
        </div>

        <div id={`RefTaskComplete-${task.id}`} popover="manual">
            <div>
                <button
                type="button"
                popoverTarget={`RefTaskComplete-${task.id}`}
                popoverTargetAction="hide"
                >閉じる
                </button>
            </div>
            
            <div>
                <p>タスクを繰り返しますか？</p>
                <button
                onClick={() => scheduleNotification(task, task.id, getNextNotificationDate(makeTargetDate(task), task.cycle))}
                type="button"
                popoverTarget={`RefTaskComplete-${task.id}`}
                popoverTargetAction="hide"
                >はい
                </button>
                <button
                onClick={() => onDelete(task.id)}
                type="button"
                popoverTarget={`RefTaskComplete-${task.id}`}
                popoverTargetAction="hide"
                >いいえ
                </button>
            </div>
        </div>

        <div id={`RefTaskSettings-${task.id}`} popover="manual">
            <div>
                <button
                onClick={resetState}
                type="button"
                popoverTarget={`RefTaskSettings-${task.id}`}
                popoverTargetAction="hide"
                >閉じる
                </button>
            </div>

            <div>
                <p>タスク名</p>
                <input
                type="text"
                id="taskName"
                value={taskName}
                onChange={getTaskName}
                />
            </div>

            <div>
                <p>締切日時</p>
                <input
                type="date"
                id="taskDeadlineDate"
                value={taskDeadlineDate}
                onChange={getTaskDeadlineDate}
                />
                <input
                type="time"
                id="taskDeadline"
                value={taskDeadline}
                onChange={getTaskDeadline}
                />
            </div>

            <div>
                <p>繰り返し周期</p>
                <select value={taskCycle} onChange={getTaskCycle}>
                    <option value="none">繰り返しなし</option>
                    <option value="day">１日１回</option>
                    <option value="week">週１回</option>
                    <option value="month">月１回</option>
                    <option value="year">年１回</option>
                </select>
            </div>

            <div>
                <button
                onClick={updateTask}
                type="button"
                popoverTarget={`RefTaskSettings-${task.id}`}
                popoverTargetAction="hide"
                >
                    タスクを更新する
                </button>
            </div>
        </div>
        </>
    )
};

export default TaskContents