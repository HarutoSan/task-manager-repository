import { useState, useRef, useEffect, type ChangeEvent } from "react";
import { v4 as uuid } from "uuid";
import TaskList from "./Components/TaskList";
import "./App.css";

type Task = {
  id: string;
  name: string;
  date: string;
  deadline: string;
  cycle: string;
  notified: boolean;
};

function App() {
  /*------------------------------------------------
  定数定義
  --------------------------------------------------*/

  //setTimeout関数の遅延時間の上限
  const MAX_TIMEOUT = 2147483647;

  //ユーザーの入力を取得し、表示するためのstate
  const [taskName, setTaskName] = useState("");
  const [taskDeadlineDate, setTaskDeadlineDate] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskCycle, setCycle] = useState("none");

  //タスクの根源
  const [tasks, setTasks] = useState<Task[]>(() => {
    const savedLocalStrageTasks = localStorage.getItem("tasks");

    if (savedLocalStrageTasks) {
      return JSON.parse(savedLocalStrageTasks);
    };
    return [];
  });

  useEffect(() => {
    localStorage.setItem("tasks",JSON.stringify(tasks));}, [tasks]);

  useEffect(() => {
    console.log("立ち上げ時のMap：", timersRef.current);
    const savedLocalStrageTasks = localStorage.getItem("tasks");
    
    if (!savedLocalStrageTasks) {
      return;
    }

    if (savedLocalStrageTasks) {
      const savedTasks: Task[] = JSON.parse(savedLocalStrageTasks);

      savedTasks.map((savedTask) => {        
        const targetDate = makeTargetDate(savedTask);
        const delay = targetDate.getTime() - Date.now();

        if (delay <= 0) {
          setTasks((prevTasks) =>
            prevTasks.map((prevTask) =>
              prevTask.id === savedTask.id ? { ...savedTask, notified: true }: prevTask));
          return;
        };

        if (delay > 0) {
          let taskCycleId: ReturnType <typeof setTimeout>;

          if (delay > MAX_TIMEOUT) {
            //MAX_TIMEOUT時間だけ経ったあとの残り時間を計算する
            const remainedDelay: number = delay - MAX_TIMEOUT;

            taskCycleId = setTimeout(() => {
              //setTimeout関数を用いてMAX_TIMEOUT時間経った後に残り時間をネオスケジュールに渡す
              neoScheduleNotification(savedTask, remainedDelay);
            }, MAX_TIMEOUT);
          } else {
            //残り時間がMAX_TIMEOUTを超えていないときは通知を設定する
            taskCycleId = setTimeout(() => {
              new Notification("タスクの時間です", {
              body: `${savedTask.name} の期限です`,
            });

            playNotificationSound();

            //通知を行ったタスクのnotifiedを通知済にする
            setTasks((prevTasks) =>
              prevTasks.map((prevTask) =>
                prevTask.id === savedTask.id ? { ...savedTask, notified: true }: prevTask));

            //通知を行ったあとはキャンセルすることなはいのでMapkからタイマーIDを削除する
            timersRef.current.delete(savedTask.id);
            }, delay);
          };

          //ifのどちらでも通知がキャンセルされたとき用にタイマーIDをセットする必要がある
          timersRef.current.set(savedTask.id, taskCycleId);
        };
      });
    };
  }, []);

  //tasksを締切順でソートしたタスク
  const sortedTasks = [...tasks].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.deadline}`);
    const dateB = new Date(`${b.date}T${b.deadline}`);

    return dateA.getTime() - dateB.getTime();
  });

  //firstTasksのための補助でソートしたためのタスクの最初の要素
  const firstTask = sortedTasks[0];

  //締切が最も近いタスクを最新のタスクとして表示するタスク
  const firstTasks = firstTask
    ? sortedTasks.filter((task) =>
        task.date === firstTask.date &&
        task.deadline === firstTask.deadline): [];

  //通知済のタスクとして表示するためのタスク
  const notifiedTasks = sortedTasks.filter((task) => task.notified);
  
  //最新のタスクでなく通知済でもないタスクを残りのタスクとして表示するタスク
  const remainingTasks = sortedTasks.filter(
    (task) => !firstTasks.includes(task) && !task.notified
  );


  //通知をキャンセルできるようにタスク毎のタイマーIDを保存する
  const timersRef = useRef< Map <string, ReturnType <typeof setTimeout>> >(new Map());

  /*------------------------------------------------
  定数定義
  --------------------------------------------------*/

  


  /*------------------------------------------------
  ユーザーの入力をsetter関数で画面に表示する
  --------------------------------------------------*/

  const getTaskName = (event: ChangeEvent<HTMLInputElement>) => {
    const taskName = event.target.value;
    setTaskName(taskName);
  };

  const getTaskDeadlineDate = (event: ChangeEvent<HTMLInputElement>) => {
    const taskDeadlineDate = event.target.value;
    setTaskDeadlineDate(taskDeadlineDate);
  }

  const getTaskDeadline = (event: ChangeEvent<HTMLInputElement>) => {
    const taskDeadline = event.target.value;
    setTaskDeadline(taskDeadline);
  };

  const getTaskCycle = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const taskCycle = event.target.value;
    setCycle(taskCycle);
  };

  /*------------------------------------------------
  ユーザーの入力をsetter関数で画面に表示する
  --------------------------------------------------*/




  /*------------------------------------------------
  メインとなる関数
  --------------------------------------------------*/
  
  //ユーザーがタスクを追加するボタンを押すとtasksに入力した情報を元にタスクを追加する
  const addTask = () : void => {
    //ユーザーが入力している情報を取得して新たにタスクとして定義する
    const addedTask: Task = {
      id: uuid(),
      name: taskName,
      date: taskDeadlineDate,
      deadline: taskDeadline,
      cycle: taskCycle,
      notified: false,
    };

    //ユーザーの入力が正しいか検査し、正しくない場合はタスクを追加せずにreturnする
    const isUserInputFinish = inspectUsersInput(addedTask);
    if (!isUserInputFinish) {
      return;
    }
        
    //tasksにユーザーが定義したタスクを追加する
    setTasks((prevTasks) => {
      return [...prevTasks, addedTask];
    });

    //通知を設定する
    handleSetNotification(addedTask);

    //次にタスクを追加するときのために入力欄を元に戻す
    resetState();
    
    //入力が正しいときのみポップアップ画面を閉じる
    const popover = document.getElementById("taskSettings");
    popover?.hidePopover();
  };

  
  
  //ユーザーが内容した入力を下にtasksを更新する
  const updateTask = (task: Task) => {
    //idは下のタスクのidを流用するー＞uuid()で更新すると管理が面倒くさい
    const updatedTask: Task = {
      id: task.id,
      name: taskName,
      date: taskDeadlineDate,
      deadline: taskDeadline,
      cycle: taskCycle,
      notified: false,
    };

    const isUserInputFinish = inspectUsersInput(updatedTask);
    if (!isUserInputFinish) {
      return;
    }

    //正しい入力がなされて初めてタイマーをキャンセルする
    cancelNotification(task.id);

    //idが一致するタスクの情報を入れ替える
    setTasks((prevTasks) => prevTasks.map((prevTask) => (
      prevTask.id === task.id ? updatedTask : prevTask)
    ));

    handleSetNotification(updatedTask);

    resetState();

    const popover = document.getElementById(`RefTaskSettings-${updatedTask.id}`);
    popover?.hidePopover();
  };



  //削除したいタスクのタイマーを止め、tasksから削除する
  const deleteTask = (task: Task) => {
    cancelNotification(task.id);
    setTasks((prevTasks) => prevTasks.filter((prevTask) => prevTask.id !== task.id));
    console.log("タスクを削除しました");
  };



  //タスクを追加したときに通知を設定する
  const handleSetNotification = async (task: Task) => {
    //使用しているブラウザがAPIに対応しているかどうか確認する
    if (!("Notification" in window)) {
      alert("このブラウザは通知に対応していません");
      return;
    };

    //ユーザーが通知を許可しているか確認する
    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    };
    if (permission !== "granted") {
      alert("通知が許可されていません");
      return;
    };

    //締切日時までの時間を計算する
    const targetDate = makeTargetDate(task);
    const delay = targetDate.getTime() - Date.now();

    //taskCycleIdにtimersRefがアクセスできるように外で定義する
    let taskCycleId: ReturnType <typeof setTimeout>;

    //delayをsetTimeout関数の遅延時間の上限と比較
    if (delay > MAX_TIMEOUT) {
      //MAX_TIMEOUT時間だけ経ったあとの残り時間を計算する
      const remainedDelay: number = delay - MAX_TIMEOUT;

      taskCycleId = setTimeout(() => {
        //setTimeout関数を用いてMAX_TIMEOUT時間経った後に残り時間をネオスケジュールに渡す
        neoScheduleNotification(task, remainedDelay);
      }, MAX_TIMEOUT);
    } else {
      //残り時間がMAX_TIMEOUTを超えていないときは通知を設定する
      taskCycleId = setTimeout(() => {
      new Notification("タスクの時間です", {
        body: `${task.name} の期限です`,
      });

      playNotificationSound();

      //通知を行ったタスクのnotifiedを通知済にする
      setTasks((prevTasks) =>
        prevTasks.map((prevTask) =>
          prevTask.id === task.id ? { ...task, notified: true }: prevTask));

      //通知を行ったあとはキャンセルすることなはいのでMapkからタイマーIDを削除する
      timersRef.current.delete(task.id);
      }, delay);
    };

    //ifのどちらでも通知がキャンセルされたとき用にタイマーIDをセットする必要がある
    timersRef.current.set(task.id, taskCycleId);
    //console.log("ハンドル時のMap：", timersRef.current);
  };
  
  
  
  //タスクを繰り返したときに通知を新たに設定する
  const scheduleNotification = (task: Task, notificationDate: Date) : void => {
    //通知を行ったタスクを繰り返したとき用にnotifiedを未通知にする
    setTasks((prevTasks) =>
      prevTasks.map((prevTask) =>
        prevTask.id === task.id ? { ...prevTask, notified: false }: prevTask));

    //未通知のタスクを繰り返すときはタイマーが動いたままなのでタイマーを止める
    cancelNotification(task.id);

    //通知までの残り時間を計算する
    let delay: number = notificationDate.getTime() - Date.now();
    //計算した次の締切日時が現在時刻を過ぎていた場合に正しい締切日時に更新する
    if (delay <= 0) {
      notificationDate = getNextFutureNotificationDate(notificationDate, task.cycle);
      delay = notificationDate.getTime() - Date.now();
    };

    //dateとdeadlineを締切日時から取得して画面の締切日時を更新する
    const newDate = `${notificationDate.getFullYear()}-${String(
      notificationDate.getMonth() + 1
    ).padStart(2, "0")}-${String(notificationDate.getDate()).padStart(2, "0")}`;   
    const newDeadline = `${String(notificationDate.getHours()).padStart(
      2,"0")}:${String(notificationDate.getMinutes()).padStart(2, "0")}`;
    updateDeadline(task.id, newDate, newDeadline);

    let taskCycleId: ReturnType <typeof setTimeout>;

    if (delay > MAX_TIMEOUT) {
      const remainedDelay: number = delay - MAX_TIMEOUT;

      taskCycleId = setTimeout(() => {
        neoScheduleNotification(task, remainedDelay);
      }, MAX_TIMEOUT);
    } else {
      taskCycleId = setTimeout(() => {
      new Notification("タスクの時間です", {
        body: `${task.name} の期限です`,
      });

      playNotificationSound();

      setTasks((prevTasks) =>
        prevTasks.map((prevTask) =>
          prevTask.id === task.id ? { ...prevTask, notified: true }: prevTask));

      //すでに通知済なのでキャンセルするときにIDは必要ない
      timersRef.current.delete(task.id);
      }, delay);
    };

    //ifのどちらでも通知がキャンセルされたとき用にタイマーIDをセットする必要がある
    timersRef.current.set(task.id, taskCycleId);
    //console.log("スケジュール時のMap：", timersRef.current);
  };

  
  
  //遅延時間がMAX_TIMEOUTを超えていたとき用の再帰関数
  const neoScheduleNotification = (task: Task, remainedDelay: number) : void => {
    //MAX_TIMEOUTだけ待ったタイマーIDを一応削除する
    cancelNotification(task.id);

    let taskCycleId: ReturnType <typeof setTimeout>;

    if (remainedDelay > MAX_TIMEOUT) {
      const nextremainedDelay = remainedDelay - MAX_TIMEOUT;

      taskCycleId = setTimeout(() => {
        neoScheduleNotification(task, nextremainedDelay);
      }, MAX_TIMEOUT);
    } else {
      taskCycleId = setTimeout(() => {
        new Notification("タスクの時間です", {
        body: `${task.name} の期限です`,
      });

      playNotificationSound();

      setTasks((prevTasks) =>
        prevTasks.map((prevTask) =>
          prevTask.id === task.id ? { ...prevTask, notified: true }: prevTask));

      timersRef.current.delete(task.id);

      }, remainedDelay);
    ;}

    //いつでもタイマーをキャンセルできるようにここでもMapにタイマーIDを保存する
    timersRef.current.set(task.id, taskCycleId);
    //console.log("ネオスケジュール時のMap：", timersRef.current);
  };

  /*------------------------------------------------
  メインとなる関数
  --------------------------------------------------*/




  /*------------------------------------------------
  メインの関数の補助関数
  --------------------------------------------------*/

  //タスクを更新するとき始めからポップアップ画面に下のタスクの情報を表示する
  const handleEdit = (task: Task) => {
    setTaskName(task.name);
    setTaskDeadlineDate(task.date);
    setTaskDeadline(task.deadline);
    setCycle(task.cycle);
  };


  
  //ポップアップ画面を閉じたときなどに入力欄を初期化する
  const resetState = () => {
    setTaskName("");
    setTaskDeadlineDate("");
    setTaskDeadline("");
    setCycle("none");
  };
  


  //ユーザーからの入力がなされているか確認する
  const inspectUsersInput = (task: Task) : boolean => {
    //タスク名が入力されているか確認する
    if (task.name === "") {
      alert("タスク名を入力してください");
      return false;
    };
  
    //締切日時が入力されているか確認する
    if (!task.date || !task.deadline) {
      alert("日付と時刻を入力してください");
      return false;
    };

    const notificationDate = makeTargetDate(task);
    const delay = notificationDate.getTime() - Date.now();

    //現在時刻が締切日時を過ぎていないか確認する
    if (delay <= 0) {
      alert("通知時刻を過ぎています");
      return false;
    };
    return true;
  };



  //タスクを繰り返すときに今のタスクの締切日時を元に次の締切日時を求める
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

  return nextDate;
  };

  //タスクを放置しすぎてgetNextNotificationDateで計算した締切日時が現在時刻を過ぎていたときのための関数
  const getNextFutureNotificationDate = (originalDate: Date, cycle: string): Date => {
    let nextDate = new Date(originalDate);

    while (nextDate.getTime() <= Date.now()) {
      nextDate = getNextNotificationDate(nextDate, cycle);
    }

    return nextDate;
  };
  
  
  //タスクを繰り返したときに画面の締切日時を更新するか
  const updateDeadline = (taskId: string, newDate: string, newDeadline: string) => {
    //更新したタスクのdateとdeadlineを更新する
    setTasks((prevTasks) =>
      prevTasks.map((currentTask) =>
        currentTask.id === taskId
          ? {...currentTask,
            date: newDate,
            deadline: newDeadline}: currentTask));
  };



  //ユーザーの入力した情報(文字列)からDate型の日時を作る
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

    return newDate;
  };

  
  
  //Mapに存在するタスクのタイマーを停止してMapから削除する
  const cancelNotification = (taskId: string) => {
    const taskCycleId = timersRef.current.get(taskId);
    if (taskCycleId !== undefined) {
      clearTimeout(taskCycleId);
      timersRef.current.delete(taskId);  
    };
  };



  //通知音を鳴らす
  const playNotificationSound = () => {
    const audio = new Audio("/notification.mp3");

    audio.play().catch((error) => {
      console.log("通知音を再生できませんでした:", error);
    });
  };

  return (
    <>
    <div>
      <h1 className="title">ToDoList</h1>
      <button className="add-button" popoverTarget="taskSettings">
      +
    </button>
      <div id="notifiedTasks">
        {(notifiedTasks.length > 0) && (<h3 className="noti-h3">通知済タスク</h3>)}
        {(notifiedTasks.length > 0) && (
          <TaskList
            tasks={notifiedTasks}
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
          />
        )}
      </div>
      <div id="latestTasks">
        {(notifiedTasks.length < 1)  && (firstTasks.length > 0) && (<h3 className="late-h3">最新タスク</h3>)}
        {(notifiedTasks.length < 1) && (firstTasks.length > 0) && (
          <TaskList
            tasks={firstTasks}
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
          />
        )}
      </div>
      <div id="remainingTasks">
        {(remainingTasks.length > 0)  && (<h3 className="rema-h3">タスク</h3>)}
        {(remainingTasks.length > 0) && (
          <TaskList
            tasks={remainingTasks}
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
          />
        )}
      </div>
    </div>

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
        <p> </p>
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