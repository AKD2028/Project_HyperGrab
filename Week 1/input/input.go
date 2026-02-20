package input

import (
	"bufio"
	"fmt"
	"os"
	"strings"
	"week1/worker"
)

func GetTerminalInput(Ctrl *worker.Controller){

	fmt.Println("Commands available : [ pause, resume, cancel ]")

	scanner := bufio.NewScanner(os.Stdin)
	
	for scanner.Scan(){

		input := strings.TrimSpace(scanner.Text())

		switch input{

		case "pause" :
			if Ctrl.PauseFlag{
				continue
			}
			Ctrl.PauseChannel=make(chan struct{})
			Ctrl.PauseFlag=true
		case "resume":
			if !Ctrl.PauseFlag{
				continue
			}
			Ctrl.PauseFlag=false
			close(Ctrl.PauseChannel)
			Ctrl.PauseChannel=nil
		case "cancel":
			Ctrl.CancelFlag=true
			if Ctrl.PauseFlag{
				close(Ctrl.PauseChannel)
			}
		default : 
			fmt.Println("Cannot identify the command")
		}

	}
}