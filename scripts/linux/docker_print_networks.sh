sudo bash -c '
netdump() {
  docker network inspect "$1" --format "network: {{.Name}}
{{range .IPAM.Config}}   subnet: {{.Subnet}}{{end}}{{range .Containers}}
      {{.Name}}: {{.IPv4Address}}{{end}}
"
}
for n in $(docker network ls -q); do netdump "$n"; done
'
