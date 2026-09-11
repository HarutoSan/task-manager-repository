import { useState, useRef, type ChangeEvent } from "react";
import { v4 as uuid } from "uuid";
import TaskList from "./Components/TaskList";

type Task = {
  id: string;
  name: string;
  date: string;
  deadline: string;
  cycle: string;
  notified: boolean;
};

function App() {
  //変数(入れ物)を用意する
  const [taskName, setTaskName] = useState("");
  const [taskDeadlineDate, setTaskDeadlineDate] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskCycle, setCycle] = useState("none");
  const [tasks, setTasks] = useState<Task[]>([]);

  const timersRef = useRef< Map <string, ReturnType <typeof setTimeout>> >(new Map());

  const resetState = () => {
    setTaskName("");
    setTaskDeadlineDate("");
    setTaskDeadline("");
    setCycle("none");
  };

  const handleEdit = (task: Task) => {
    setTaskName(task.name);
    setTaskDeadlineDate(task.date);
    setTaskDeadline(task.deadline);
    setCycle(task.cycle);
  };

  //入れ物に入力された内容を代入する
  const getTaskName = (event: ChangeEvent<HTMLInputElement>) => {
    const taskName = event.target.value;
    setTaskName(taskName);
  };

  //入れ物に入力された内容を代入する
  const getTaskDeadlineDate = (event: ChangeEvent<HTMLInputElement>) => {
    const taskDeadlineDate = event.target.value;
    setTaskDeadlineDate(taskDeadlineDate);
  }

  //入れ物に入力された内容を代入する
  const getTaskDeadline = (event: ChangeEvent<HTMLInputElement>) => {
    const taskDeadline = event.target.value;
    setTaskDeadline(taskDeadline);
  };

  const getTaskCycle = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const taskCycle = event.target.value;
    setCycle(taskCycle);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.deadline}`);
    const dateB = new Date(`${b.date}T${b.deadline}`);

    return dateA.getTime() - dateB.getTime();
  });

  const firstTask = sortedTasks[0];

  const firstTasks = firstTask
    ? sortedTasks.filter(
      (task) =>
        task.date === firstTask.date &&
        task.deadline === firstTask.deadline): [];

  const remainingTasks = sortedTasks.filter(
    (task) => !firstTasks.includes(task) && !task.notified
  );

  const notifiedTasks = sortedTasks.filter((task) => task.notified);

  const addTask = () => {
    const newTask: Task = {
      id: uuid(),
      name: taskName,
      date: taskDeadlineDate,
      deadline: taskDeadline,
      cycle: taskCycle,
      notified: false,
    };

    if (newTask.name === "") {
      alert("タスク名を入力してください");
      return;
    };

    // ② 日付・時刻をチェック
    if (!newTask.date || !newTask.deadline) {
      alert("日付と時刻を入力してください");
      return;
    };

    // ③ 通知時刻をチェック
    const notificationDate = makeTargetDate(newTask);
    const delay = notificationDate.getTime() - Date.now();

    if (delay <= 0) {
      alert("通知時刻を過ぎています");
      return;
    };
    
    
    setTasks((prevTasks) => {
      return [...prevTasks, newTask];
    });

    handleSetNotification(newTask);

    resetState();
    
    const popover = document.getElementById("taskSettings");
    popover?.hidePopover();
    };

  const updateTask = (taskId: string) => {
    cancelNotification(taskId);

    const updatedTask: Task = {
      id: taskId,
      name: taskName,
      date: taskDeadlineDate,
      deadline: taskDeadline,
      cycle: taskCycle,
      notified: false,
    };

    if (updatedTask.name === "") {
      alert("タスク名を入力してください");
      return false;
    };

    // ② 日付・時刻をチェック
    if (!updatedTask.date || !updatedTask.deadline) {
      alert("日付と時刻を入力してください");
      return false;
    };

    // ③ 通知時刻をチェック
    const notificationDate = makeTargetDate(updatedTask);
    const delay = notificationDate.getTime() - Date.now();

    if (delay <= 0) {
      alert("通知時刻を過ぎています");
      return false;
    };

    setTasks((prevTasks) => prevTasks.map((task) => (
      task.id === taskId ? updatedTask : task)
    ));

    handleSetNotification(updatedTask);

    resetState();    
  };

  const getNextNotificationDate = (currentDate: Date, cycle: string): Date => {
    const nextDate = new Date(currentDate);

    if (cycle === "day") {
      nextDate.setMinutes(nextDate.getMinutes() + 1);
    }
    else if (cycle === "week") {
      nextDate.setDate(nextDate.getDate() + 7);
    }
    else if (cycle === "month") {
      const originalDay = nextDate.getDate();
      nextDate.setDate(1);
      nextDate.setMonth(nextDate.getMonth() + 1);

      const lastDayOfMonth = new Date(
        nextDate.getFullYear(),
        nextDate.getMonth() + 1,
        0
      ).getDate();

      nextDate.setDate(
        Math.min(originalDay, lastDayOfMonth)
      );
    }
    else if (cycle === "year") {
      const originalMonth = nextDate.getMonth();
      const originalDay = nextDate.getDate();

      nextDate.setDate(1);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      nextDate.setMonth(originalMonth);

      const lastDayOfMonth = new Date(
        nextDate.getFullYear(),
        originalMonth + 1,
        0
      ).getDate();

      nextDate.setDate(
        Math.min(originalDay, lastDayOfMonth)
      );
    };

  console.log("getNextNotificationDateで作った日時:", nextDate);

  return nextDate;
  };

  const getNextFutureNotificationDate = (
  originalDate: Date,
  cycle: string
): Date => {
  let nextDate = new Date(originalDate);

  while (nextDate.getTime() <= Date.now()) {
    nextDate = getNextNotificationDate(nextDate, cycle);
  }

  return nextDate;
};

  const scheduleNotification = (task: Task, taskId: string, notificationDate: Date) => {
    console.log("スケジューリング開始", task.name);

    setTasks((prevTasks) =>
      prevTasks.map((task) =>
        task.id === taskId ? { ...task, notified: false }: task));

    // ① 古いタイマーを取得
    const oldTimerId = timersRef.current.get(taskId);

    // ② 古いタイマーが存在すればキャンセル
    if (oldTimerId !== undefined) {
      clearTimeout(oldTimerId);
      console.log("古いタイマーをキャンセルしました");
    }

    let delay = notificationDate.getTime() - Date.now();

    if (delay <= 0) {
      console.log("通知時刻が過ぎているため、通知を再設定します。");
      notificationDate = getNextFutureNotificationDate(notificationDate, task.cycle);
      console.log("最終的な通知時刻:", notificationDate);
      delay = notificationDate.getTime() - Date.now();
    };

    const newDate = `${notificationDate.getFullYear()}-${String(
      notificationDate.getMonth() + 1
    ).padStart(2, "0")}-${String(notificationDate.getDate()).padStart(2, "0")}`;
    const newDeadline = `${String(notificationDate.getHours()).padStart(
      2,
      "0"
    )}:${String(notificationDate.getMinutes()).padStart(2, "0")}`;

    const taskCycleId = setTimeout(() => {
      new Notification("タスクの時間です", {
        body: `${task.name} の期限です`,
      });

      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, notified: true }: task));

      console.log("scheduleで通知を実行したよ", task.name, "現在時刻：", new Date());
    }, delay);

    updateDeadline(taskId, newDate, newDeadline);
    timersRef.current.set(task.id, taskCycleId);
    console.log("スケジュール時のMap", timersRef.current);
  };
  
  const updateDeadline = (taskId: string, newDate: string, newDeadline: string) => {
    console.log("締切の更新と表示を行います");

    setTasks((prevTasks) =>
      prevTasks.map((currentTask) =>
        currentTask.id === taskId
          ? {...currentTask,
            date: newDate,
            deadline: newDeadline}: currentTask));
  };

  const handleSetNotification = async (task: Task) => {
    // 日付と時刻が入力されているか確認
    if (!task.date || !task.deadline) {
      alert("日付と時刻を入力してください");
      return;
    }

    // 通知機能が使えるか確認
    if (!("Notification" in window)) {
      alert("このブラウザは通知に対応していません");
      return;
    }

    // 通知の許可を確認
    let permission = Notification.permission;

    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission !== "granted") {
      alert("通知が許可されていません");
      return;
    }

    const targetDate = makeTargetDate(task);

    const delay = targetDate.getTime() - Date.now();

    console.log("現在:", new Date());
    console.log("通知時刻:", targetDate);

    const taskCycleId = setTimeout(() => {
      new Notification("タスクの時間です", {
        body: `${task.name} の期限です`,
      });

      setTasks((prevTasks) =>
        prevTasks.map((prevtask) =>
          prevtask.id === task.id ? { ...prevtask, notified: true }: prevtask));

      console.log("handleで通知を実行したよ", task.name, "現在時刻：", new Date());
    }, delay);

    timersRef.current.set(task.id, taskCycleId);

    console.log("ハンドル時のMap", timersRef.current);
  };

  const makeTargetDate = (task: Task): Date => {
    const [year, month, day] = task.date.split("-").map(Number);
    const [hour, minute] = task.deadline.split(":").map(Number);

    const newDate = new Date(
      year,
      month - 1,
      day,
      hour,
      minute,
      0,
      0
    );

    console.log("makeTargetDateで作った日時:", newDate);

    return newDate;
  };

  const cancelNotification = (taskId: string) => {
    const taskCycleId = timersRef.current.get(taskId);
    clearTimeout(taskCycleId);
    timersRef.current.delete(taskId);  
  };
  
  const deleteTask = (taskId: string) => {
    cancelNotification(taskId);
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    console.log("タスクを削除しました");
  };


  return (
    <>
    <div>
      <h1>タスク管理アプリ</h1>
      <div>
        {(notifiedTasks.length > 0) && (<h3>通知済みのタスクを表示</h3>)}
        {(notifiedTasks.length > 0) && (
          <TaskList
            tasks={notifiedTasks}
            onDelete={deleteTask}
            resetState={resetState}
            taskName={taskName}
            taskDeadlineDate={taskDeadlineDate}
            taskDeadline={taskDeadline}
            taskCycle={taskCycle}
            getTaskName={getTaskName}
            getTaskDeadlineDate={getTaskDeadlineDate}
            getTaskDeadline={getTaskDeadline}
            getTaskCycle={getTaskCycle}
            onUpdate={updateTask}
            handleSetNotification={handleSetNotification}
            makeTargetDate={makeTargetDate}
            scheduleNotification={scheduleNotification}
            getNextNotificationDate={getNextNotificationDate}
            handleEdit={handleEdit}
          />
        )}
      </div>
      <div>
        {(notifiedTasks.length < 1)  && (firstTasks.length > 0) && (<h3>最新のタスク</h3>)}
        {(notifiedTasks.length < 1) && (firstTasks.length > 0) && (
          <TaskList
            tasks={firstTasks}
            onDelete={deleteTask}
            resetState={resetState}
            taskName={taskName}
            taskDeadlineDate={taskDeadlineDate}
            taskDeadline={taskDeadline}
            taskCycle={taskCycle}
            getTaskName={getTaskName}
            getTaskDeadlineDate={getTaskDeadlineDate}
            getTaskDeadline={getTaskDeadline}
            getTaskCycle={getTaskCycle}
            onUpdate={updateTask}
            handleSetNotification={handleSetNotification}
            makeTargetDate={makeTargetDate}
            scheduleNotification={scheduleNotification}
            getNextNotificationDate={getNextNotificationDate}
            handleEdit={handleEdit}
          />
        )}
      </div>
      <div>
        {(remainingTasks.length > 0)  && (<h3>残りのタスクを表示</h3>)}
        {(remainingTasks.length > 0) && (
          <TaskList
            tasks={remainingTasks}
            onDelete={deleteTask}
            resetState={resetState}
            taskName={taskName}
            taskDeadlineDate={taskDeadlineDate}
            taskDeadline={taskDeadline}
            taskCycle={taskCycle}
            getTaskName={getTaskName}
            getTaskDeadlineDate={getTaskDeadlineDate}
            getTaskDeadline={getTaskDeadline}
            getTaskCycle={getTaskCycle}
            onUpdate={updateTask}
            handleSetNotification={handleSetNotification}
            makeTargetDate={makeTargetDate}
            scheduleNotification={scheduleNotification}
            getNextNotificationDate={getNextNotificationDate}
            handleEdit={handleEdit}
          />
        )}
      </div>
    </div>

    <button popoverTarget="taskSettings">
      +
    </button>

    <div id="taskSettings" popover="manual">
      <div>
        <button
          onClick={resetState}
          type="button"
          popoverTarget="taskSettings"
          popoverTargetAction="hide"
          >
          閉じる
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
          onClick={addTask}
          type="button"
        >
          タスクを追加する
        </button>
      </div>
    </div>
    </>
  );
}

export default App;