//go:build ignore

package main
import (
	"fmt"
	"regexp"
	"strings"
)
func main() {
	pattern := "*.example.com"
	clean := strings.ReplaceAll(regexp.QuoteMeta(pattern), "\\*", ".*")
	fmt.Println(clean)
	re := regexp.MustCompile(clean)
	fmt.Println(re.MatchString("www.example.com"))
}
