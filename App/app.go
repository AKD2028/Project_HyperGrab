package main

import (
	"App/manager"
	"context"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"fmt"
)

// App struct
type App struct {
	ctx context.Context
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a * App) FetchBaseDirectory() (string,error) {
	fmt.Println("Selecting base Directory")
	path,err := runtime.OpenDirectoryDialog(a.ctx,runtime.OpenDialogOptions{
		Title: "Choose Base Directory",
	})
	if err!=nil{
		return "",err
	}
	return path,nil
}

func (a * App) SayHello(){
	fmt.Println("Hello World")
}

func (a * App) StartDownload(url string,chunks int,baseDirectory string,ECO bool){
	runtime.EventsEmit(a.ctx,"UpdateStatus","wait")
	err:= manager.Manager(url,chunks,a.ctx,baseDirectory,ECO)
	if err!=nil{
		fmt.Println(err)
		runtime.EventsEmit(a.ctx,"Error",err.Error())
		return
	}
	runtime.EventsEmit(a.ctx,"Done")

	runtime.EventsOff(a.ctx,"pause","resume","cancel")
}






