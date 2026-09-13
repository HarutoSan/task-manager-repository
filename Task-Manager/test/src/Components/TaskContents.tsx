import type { ChangeEvent } from "react";
import "../TaskContents.css";

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

const TaskContents = ( {
    task,
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
    makeTargetDate,
    scheduleNotification,
    getNextNotificationDate,
    handleEdit} : TaskSettingsProps ) => {

        //画面にカスタマイズして表示するために分割代入する
        const [year, month, day] = task.date.split("-").map(Number);



        //繰り返しなしのタスクはタスクの繰り返し確認ポップアップ画面を開かずにそのまま削除する
        const handleComplete = (task: Task) => {
            if (task.cycle === "none") {
                deleteTask(task);
            } else {
                const popover = document.getElementById(`RefTaskComplete-${task.id}`);
                popover?.showPopover();
            }
        };

    
    
        //締切日時の曜日を取得する
        const getDayOfWeek = (dateString: string) => {
            const date = new Date(dateString);
            const days = ["日", "月", "火", "水", "木", "金", "土"];
            return days[date.getDay()];
        };
        return (
        <>
        <div className="task-block">
            <div className="task-contents">
                <p>タスク名: {task.name}</p>
                <p>締切日時: {year}年{month}月{day}日（{getDayOfWeek(task.date)}） at {task.deadline}</p>
                <p>繰り返し: {task.cycle}</p>
            </div>
            <div className="task-buttons">
                <button className="task-button" onClick={() => handleComplete(task)}>タスクを完了</button>
                <button className="task-button" onClick={() => handleEdit(task)} popoverTarget={`RefTaskSettings-${task.id}`}>タスクを編集</button>
                <button className="task-button" onClick={() => deleteTask(task)}>タスクを削除</button>
            </div>
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
            
            <p>タスクを繰り返しますか？</p>
            <div>
                <button
                onClick={() => scheduleNotification(task, getNextNotificationDate(makeTargetDate(task), task.cycle))}
                type="button"
                popoverTarget={`RefTaskComplete-${task.id}`}
                popoverTargetAction="hide"
                >はい
                </button>
                <button
                onClick={() => deleteTask(task)}
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

            <p>締切日時</p>
            <div className="datetime-inputs">
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
                <p>繰り返し</p>
                <select value={taskCycle} onChange={getTaskCycle}>
                    <option value="none">繰り返しなし</option>
                    <option value="day">１日１回</option>
                    <option value="week">週１回</option>
                    <option value="month">月１回</option>
                    <option value="year">年１回</option>
                </select>
            </div>

            <div>
                <p></p>
                <button
                onClick={() => updateTask(task)}
                type="button"
                >
                    タスクを更新する
                </button>
            </div>
        </div>
        </>
    )
};

export default TaskContents