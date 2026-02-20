package main

import (
	"flag"
	"fmt"
	"os"
	"week1/manager"
)

func main() {

	//Command-line

	url := flag.String("url", "", "File URL to download")
	chunks := flag.Int("chunks", 4, "Number of parts to split into")

	flag.Parse()

	//Validate input
	if *url == "" {
		fmt.Println("Error: URL is required")
		os.Exit(1)
	}

	if *chunks <= 0 {
		fmt.Println("Error: chunks must be greater than 0")
		os.Exit(1)
	}

	//Start HyperGrab
	fmt.Println("Starting download...")
	err := manager.Manager(*url, *chunks)
	if err != nil {
		fmt.Println(err)
	}
}
